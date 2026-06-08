import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { VisionRoom as VisionRoomType, VisionParticipant, VisionContribution } from './vision.types';
import { VisionRoom, VisionRoomDocument } from './schemas/vision-room.schema';

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
export class VisionService {
  constructor(
    @InjectModel(VisionRoom.name) private visionRoomModel: Model<VisionRoomDocument>,
  ) {}

  // ── Room lifecycle ────────────────────────────────────────────────────────
  async createRoom(): Promise<VisionRoomType> {
    let code: string;
    let exists = true;

    do {
      code = genCode();
      const result = await this.visionRoomModel.exists({ code });
      exists = result !== null;
    } while (exists);

    const room = new this.visionRoomModel({
      code,
      step: 0,
      participants: {},
      templateId: null,
      contributions: {},
      votes: {},
      synthesis: {},
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const saved = await room.save();
    return this.toRoomType(saved);
  }

  async getRoom(code: string): Promise<VisionRoomType | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    return room ? this.toRoomType(room) : null;
  }

  async roomExists(code: string): Promise<boolean> {
    return (await this.visionRoomModel.exists({ code: code.toUpperCase() })) !== null;
  }

  // ── Participants ──────────────────────────────────────────────────────────
  async joinRoom(code: string, name: string, avatar = ''): Promise<{ room: VisionRoomType; participant: VisionParticipant } | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const participant: VisionParticipant = {
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

  async leaveRoom(code: string, name: string): Promise<VisionRoomType | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    delete room.participants[name];
    room.markModified('participants');

    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Step ──────────────────────────────────────────────────────────────────
  async setStep(code: string, step: number): Promise<VisionRoomType | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    room.step = step as any;
    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Template ──────────────────────────────────────────────────────────────
  async setTemplate(code: string, templateId: string): Promise<VisionRoomType | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    room.templateId = templateId;
    room.contributions = {};
    room.votes = {};
    room.synthesis = {};
    room.markModified('contributions');
    room.markModified('votes');
    room.markModified('synthesis');

    const updated = await room.save();
    return this.toRoomType(updated);
  }

  // ── Contributions ─────────────────────────────────────────────────────────
  async addContribution(code: string, sectionKey: string, text: string, author: string): Promise<{ sectionKey: string; contribution: VisionContribution } | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    const contribution: VisionContribution = {
      id: uuidv4(),
      text: text.trim().slice(0, 500),
      author,
      createdAt: Date.now(),
    };

    if (!room.contributions[sectionKey]) room.contributions[sectionKey] = {};
    room.contributions[sectionKey][contribution.id] = contribution;
    room.markModified('contributions');

    await room.save();
    return { sectionKey, contribution };
  }

  async deleteContribution(code: string, sectionKey: string, contribId: string): Promise<boolean> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return false;

    const section = room.contributions[sectionKey];
    if (!section || !section[contribId]) return false;

    delete section[contribId];
    room.markModified('contributions');

    // Remove votes for this contribution
    if (room.votes[sectionKey]) {
      delete room.votes[sectionKey][contribId];
      room.markModified('votes');
    }

    await room.save();
    return true;
  }

  // ── Votes ─────────────────────────────────────────────────────────────────
  async toggleVote(code: string, sectionKey: string, contribId: string, voterName: string): Promise<Record<string, Record<string, string[]>> | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    if (!room.votes[sectionKey]) room.votes[sectionKey] = {};
    if (!room.votes[sectionKey][contribId]) room.votes[sectionKey][contribId] = [];

    const voters = room.votes[sectionKey][contribId];
    const idx = voters.indexOf(voterName);
    if (idx === -1) {
      voters.push(voterName);
    } else {
      voters.splice(idx, 1);
    }

    room.votes[sectionKey][contribId] = voters;
    room.markModified('votes');

    await room.save();
    return room.votes;
  }

  // ── Synthesis ─────────────────────────────────────────────────────────────
  async setSynthesis(code: string, sectionKey: string, text: string): Promise<{ sectionKey: string; text: string } | null> {
    const room = await this.visionRoomModel.findOne({ code: code.toUpperCase() }).exec();
    if (!room) return null;

    room.synthesis[sectionKey] = text;
    room.markModified('synthesis');

    await room.save();
    return { sectionKey, text };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private toRoomType(doc: VisionRoomDocument): VisionRoomType {
    return {
      code: doc.code,
      step: doc.step,
      participants: doc.participants,
      templateId: doc.templateId,
      contributions: doc.contributions,
      votes: doc.votes,
      synthesis: doc.synthesis,
      createdAt: doc.createdAt,
    };
  }
}
