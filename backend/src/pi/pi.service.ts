import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PIRoom as PIRoomType, PIParticipant, PIConfig, PISprint, PIStory, PIRisk } from './pi.types';
import { PIRoom, PIRoomDocument } from './schemas/pi-room.schema';

// ── Color palette ─────────────────────────────────────────────────────────
const PALETTE: [string, string][] = [
  ['#a78bfa', '#1e1240'], ['#4ade80', '#0d2a1a'], ['#f87171', '#2a0d0d'],
  ['#60a5fa', '#0d1e35'], ['#fb923c', '#2a1205'], ['#e879f9', '#280d2a'],
  ['#34d399', '#052a1e'], ['#fbbf24', '#2a1a05'], ['#f472b6', '#2a0d1e'],
  ['#38bdf8', '#041e2a'],
];

function pickColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h][0];
}

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

@Injectable()
export class PIService {
  constructor(
    @InjectModel(PIRoom.name) private piRoomModel: Model<PIRoomDocument>,
  ) {}

  // ── Room lifecycle ────────────────────────────────────────────────────────
  async createRoom(): Promise<PIRoomType> {
    let code: string;
    let exists = true;

    do {
      code = genCode();
      const result = await this.piRoomModel.exists({ code });
      exists = result !== null;
    } while (exists);

    const room = new this.piRoomModel({
      code,
      step: 0,
      participants: {},
      config: null,
      sprints: [],
      capacity: {},
      stories: {},
      risks: {},
      confidence: {},
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const saved = await room.save();
    return this.toRoomType(saved);
  }

  async getRoom(code: string): Promise<PIRoomType | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    return room ? this.toRoomType(room) : null;
  }

  async roomExists(code: string): Promise<boolean> {
    return (await this.piRoomModel.exists({ code: code.toUpperCase() })) !== null;
  }

  // ── Participants ──────────────────────────────────────────────────────────
  async joinRoom(code: string, name: string, avatar = ''): Promise<{ room: PIRoomType; participant: PIParticipant } | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const participant: PIParticipant = {
      id: uuidv4(),
      name,
      color: pickColor(name),
      avatar,
      joinedAt: Date.now(),
    };

    room.participants[name] = participant;
    room.markModified('participants');

    const updated = await room.save();
    return { room: this.toRoomType(updated), participant };
  }

  async leaveRoom(code: string, name: string): Promise<PIRoomType | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    delete room.participants[name];
    room.markModified('participants');

    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Step ──────────────────────────────────────────────────────────────────
  async setStep(code: string, step: number): Promise<PIRoomType | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    room.step = step as any;
    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Config + Sprints ──────────────────────────────────────────────────────
  async setConfig(code: string, config: PIConfig, sprints: PISprint[]): Promise<PIRoomType | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    room.config = config;
    room.sprints = sprints;
    room.markModified('config');
    room.markModified('sprints');

    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Capacity ──────────────────────────────────────────────────────────────
  async setCapacity(code: string, participantName: string, sprintId: string, days: number): Promise<Record<string, Record<string, number>> | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    if (!room.capacity[participantName]) room.capacity[participantName] = {};
    room.capacity[participantName][sprintId] = days;
    room.markModified('capacity');

    await room.save();
    return room.capacity;
  }

  // ── Stories ───────────────────────────────────────────────────────────────
  async addStory(code: string, title: string, points: number, priority: string, sprintId: string, author: string): Promise<PIStory | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const story: PIStory = {
      id: uuidv4(),
      title: title.trim().slice(0, 300),
      points,
      priority,
      sprintId,
      author,
      createdAt: Date.now(),
    };

    room.stories[story.id] = story;
    room.markModified('stories');

    await room.save();
    return story;
  }

  async updateStory(code: string, storyId: string, updates: Partial<Omit<PIStory, 'id' | 'author' | 'createdAt'>>): Promise<PIStory | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room || !room.stories[storyId]) return null;

    const story = room.stories[storyId];
    if (updates.title !== undefined) story.title = updates.title.trim().slice(0, 300);
    if (updates.points !== undefined) story.points = updates.points;
    if (updates.priority !== undefined) story.priority = updates.priority;
    if (updates.sprintId !== undefined) story.sprintId = updates.sprintId;
    room.stories[storyId] = story;
    room.markModified('stories');

    await room.save();
    return story;
  }

  async deleteStory(code: string, storyId: string): Promise<boolean> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room || !room.stories[storyId]) return false;

    delete room.stories[storyId];
    room.markModified('stories');

    await room.save();
    return true;
  }

  // ── Risks ─────────────────────────────────────────────────────────────────
  async addRisk(code: string, title: string, level: string, mitigation: string, author: string): Promise<PIRisk | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const risk: PIRisk = {
      id: uuidv4(),
      title: title.trim().slice(0, 300),
      level,
      mitigation: mitigation.trim().slice(0, 500),
      author,
      createdAt: Date.now(),
    };

    room.risks[risk.id] = risk;
    room.markModified('risks');

    await room.save();
    return risk;
  }

  async deleteRisk(code: string, riskId: string): Promise<boolean> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room || !room.risks[riskId]) return false;

    delete room.risks[riskId];
    room.markModified('risks');

    await room.save();
    return true;
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  async setConfidenceVote(code: string, participantName: string, vote: number): Promise<Record<string, number> | null> {
    const room = await this.piRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const clampedVote = Math.min(5, Math.max(1, Math.round(vote)));
    room.confidence[participantName] = clampedVote;
    room.markModified('confidence');

    await room.save();
    return room.confidence;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private toRoomType(doc: PIRoomDocument): PIRoomType {
    return {
      code: doc.code,
      step: doc.step,
      participants: doc.participants,
      config: doc.config,
      sprints: doc.sprints,
      capacity: doc.capacity,
      stories: doc.stories,
      risks: doc.risks,
      confidence: doc.confidence,
      createdAt: doc.createdAt,
    };
  }
}
