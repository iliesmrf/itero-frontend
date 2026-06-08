import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VisionService } from './vision.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  namespace: 'vision',
  cors: { origin: process.env.FRONTEND_URL || 'http://itero.mantiq.fr:5173', credentials: true },
})
export class VisionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private socketMeta = new Map<string, { room: string; name: string; avatar: string }>();

  constructor(
    private readonly visionService: VisionService,
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
    // Don't remove from DB on disconnect — contributions must survive disconnects.
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
    const room = await this.visionService.createRoom();
    const result = await this.visionService.joinRoom(room.code, user.name, user.avatar);
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
    if (!(await this.visionService.roomExists(code))) return this.err(client, 'Salle introuvable');
    const result = await this.visionService.joinRoom(code, user.name, user.avatar);
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
    const room = await this.visionService.leaveRoom(meta.room, meta.name);
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
    const room = await this.visionService.setStep(meta.room, data.step);
    if (!room) return;
    this.broadcast(meta.room, 'step:changed', { step: data.step });
  }

  // ── Template ──────────────────────────────────────────────────────────────
  @SubscribeMessage('vision:template:set')
  async handleSetTemplate(@ConnectedSocket() client: Socket, @MessageBody() data: { templateId: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.templateId) return;
    const room = await this.visionService.setTemplate(meta.room, data.templateId);
    if (!room) return;
    this.broadcast(meta.room, 'vision:template:updated', { templateId: data.templateId });
  }

  // ── Contributions ─────────────────────────────────────────────────────────
  @SubscribeMessage('vision:contribute')
  async handleContribute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sectionKey: string; contribution: { text: string } },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.sectionKey || !data?.contribution?.text?.trim()) return;
    const result = await this.visionService.addContribution(meta.room, data.sectionKey, data.contribution.text, meta.name);
    if (!result) return;
    this.broadcast(meta.room, 'vision:contribution:added', result);
  }

  @SubscribeMessage('vision:contribute:delete')
  async handleDeleteContribution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sectionKey: string; contribId: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.sectionKey || !data?.contribId) return;
    const ok = await this.visionService.deleteContribution(meta.room, data.sectionKey, data.contribId);
    if (!ok) return;
    this.broadcast(meta.room, 'vision:contribution:deleted', { sectionKey: data.sectionKey, contribId: data.contribId });
  }

  // ── Votes ─────────────────────────────────────────────────────────────────
  @SubscribeMessage('vision:vote:toggle')
  async handleToggleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sectionKey: string; contribId: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.sectionKey || !data?.contribId) return;
    const votes = await this.visionService.toggleVote(meta.room, data.sectionKey, data.contribId, meta.name);
    if (!votes) return;
    this.broadcast(meta.room, 'vision:votes:updated', { votes });
  }

  // ── Synthesis ─────────────────────────────────────────────────────────────
  @SubscribeMessage('vision:synthesis:set')
  async handleSetSynthesis(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sectionKey: string; text: string },
  ) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.sectionKey) return;
    const result = await this.visionService.setSynthesis(meta.room, data.sectionKey, data.text || '');
    if (!result) return;
    this.broadcast(meta.room, 'vision:synthesis:updated', result);
  }
}
