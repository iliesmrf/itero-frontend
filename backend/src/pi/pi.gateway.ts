import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PIService } from './pi.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  namespace: 'pi',
  cors: { origin: process.env.FRONTEND_URL || 'http://itero.mantiq.fr:5173', credentials: true },
})
export class PIGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private socketMeta = new Map<string, { room: string; name: string; avatar: string }>();

  constructor(
    private readonly piService: PIService,
    private readonly authService: AuthService,
  ) {}

  // ── Connection ────────────────────────────────────────────────────────────
  handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token || client.handshake?.query?.token;
    if (!token) { client.emit('error', { message: 'Authentification requise' }); client.disconnect(); return; }
    const payload = this.authService.verify(String(token));
    if (!payload) { client.emit('error', { message: 'Token invalide' }); client.disconnect(); return; }
    (client as any).user = payload;
  }

  handleDisconnect(client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    this.socketMeta.delete(client.id);
    // Broadcast presence update but don't remove from DB — contributions must survive disconnects.
    // Explicit room:leave is the only event that removes the participant from the DB.
    this.broadcast(meta.room, 'participant:left', { name: meta.name });
  }

  private broadcast(roomCode: string, event: string, payload: any) {
    this.server.to(roomCode).emit(event, payload);
  }

  private err(client: Socket, message: string) { client.emit('error', { message }); }

  private getUser(client: Socket): { name: string; avatar: string } | null {
    const user = (client as any).user;
    return user ? { name: user.name, avatar: user.avatar || '' } : null;
  }

  // ── Room ──────────────────────────────────────────────────────────────────
  @SubscribeMessage('room:create')
  async handleCreateRoom(@ConnectedSocket() client: Socket) {
    const user = this.getUser(client);
    if (!user) return this.err(client, 'Non authentifié');
    const room = await this.piService.createRoom();
    const result = await this.piService.joinRoom(room.code, user.name, user.avatar);
    if (!result) return this.err(client, 'Erreur création');
    client.join(room.code);
    this.socketMeta.set(client.id, { room: room.code, name: user.name, avatar: user.avatar });
    client.emit('room:joined', { room: result.room, me: result.participant });
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { code: string }) {
    const user = this.getUser(client);
    if (!user) return this.err(client, 'Non authentifié');
    const code = data?.code?.trim().toUpperCase();
    if (!code) return this.err(client, 'Code requis');
    if (!(await this.piService.roomExists(code))) return this.err(client, 'Salle introuvable');
    const result = await this.piService.joinRoom(code, user.name, user.avatar);
    if (!result) return this.err(client, 'Erreur rejoindre');
    client.join(code);
    this.socketMeta.set(client.id, { room: code, name: user.name, avatar: user.avatar });
    client.emit('room:joined', { room: result.room, me: result.participant });
    this.broadcast(code, 'participant:joined', result.participant);
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return this.err(client, 'Non authentifié');
    const room = await this.piService.leaveRoom(meta.room, meta.name);
    if (room) {
      this.broadcast(meta.room, 'room:updated', room);
      this.broadcast(meta.room, 'participant:left', { name: meta.name });
    }
    client.leave(meta.room);
    this.socketMeta.delete(client.id);
    client.emit('room:left');
  }

  // ── Step ──────────────────────────────────────────────────────────────────
  @SubscribeMessage('step:set')
  async handleSetStep(@ConnectedSocket() client: Socket, @MessageBody() data: { step: number }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.piService.setStep(meta.room, data.step);
    if (!room) return;
    this.broadcast(meta.room, 'step:changed', { step: data.step });
  }

  // ── PI Config ─────────────────────────────────────────────────────────────
  @SubscribeMessage('pi:config:set')
  async handleSetConfig(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { config: { name: string; startDate: string; endDate: string; durationWeeks: number }; sprints: any[] },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.piService.setConfig(meta.room, data.config, data.sprints || []);
    if (!room) return;
    this.broadcast(meta.room, 'pi:config:updated', { config: room.config, sprints: room.sprints });
  }

  // ── Capacity ──────────────────────────────────────────────────────────────
  @SubscribeMessage('pi:capacity:set')
  async handleSetCapacity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sprintId: string; days: number },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const capacity = await this.piService.setCapacity(meta.room, meta.name, data.sprintId, data.days);
    if (!capacity) return;
    this.broadcast(meta.room, 'pi:capacity:updated', { capacity });
  }

  // ── Stories ───────────────────────────────────────────────────────────────
  @SubscribeMessage('pi:story:add')
  async handleAddStory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { title: string; points: number; priority: string; sprintId: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.title?.trim()) return;
    const story = await this.piService.addStory(meta.room, data.title, data.points || 0, data.priority || 'medium', data.sprintId || '', meta.name);
    if (!story) return;
    this.broadcast(meta.room, 'pi:story:added', story);
  }

  @SubscribeMessage('pi:story:update')
  async handleUpdateStory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storyId: string; title?: string; points?: number; priority?: string; sprintId?: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.storyId) return;
    const { storyId, ...updates } = data;
    const story = await this.piService.updateStory(meta.room, storyId, updates);
    if (!story) return;
    this.broadcast(meta.room, 'pi:story:updated', story);
  }

  @SubscribeMessage('pi:story:delete')
  async handleDeleteStory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storyId: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.storyId) return;
    const ok = await this.piService.deleteStory(meta.room, data.storyId);
    if (!ok) return;
    this.broadcast(meta.room, 'pi:story:deleted', { storyId: data.storyId });
  }

  // ── Risks ─────────────────────────────────────────────────────────────────
  @SubscribeMessage('pi:risk:add')
  async handleAddRisk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { title: string; level: string; mitigation: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.title?.trim()) return;
    const risk = await this.piService.addRisk(meta.room, data.title, data.level || 'medium', data.mitigation || '', meta.name);
    if (!risk) return;
    this.broadcast(meta.room, 'pi:risk:added', risk);
  }

  @SubscribeMessage('pi:risk:delete')
  async handleDeleteRisk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { riskId: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.riskId) return;
    const ok = await this.piService.deleteRisk(meta.room, data.riskId);
    if (!ok) return;
    this.broadcast(meta.room, 'pi:risk:deleted', { riskId: data.riskId });
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  @SubscribeMessage('pi:confidence:vote')
  async handleConfidenceVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vote: number },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const confidence = await this.piService.setConfidenceVote(meta.room, meta.name, data.vote);
    if (!confidence) return;
    this.broadcast(meta.room, 'pi:confidence:updated', { confidence });
  }
}
