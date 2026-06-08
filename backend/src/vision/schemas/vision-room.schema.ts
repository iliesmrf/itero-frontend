import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { VisionStep, VisionParticipant, VisionContribution } from '../vision.types';

export type VisionRoomDocument = VisionRoom & Document;

@Schema({ timestamps: true })
export class VisionRoom {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: Number, default: 0 })
  step: VisionStep;

  @Prop({ type: Object, default: {} })
  participants: Record<string, VisionParticipant>;

  @Prop({ type: String, default: null })
  templateId: string | null;

  @Prop({ type: Object, default: {} })
  contributions: Record<string, Record<string, VisionContribution>>;

  @Prop({ type: Object, default: {} })
  votes: Record<string, Record<string, string[]>>;

  @Prop({ type: Object, default: {} })
  synthesis: Record<string, string>;

  @Prop({ type: Number, default: Date.now })
  createdAt: number;

  @Prop({ type: Date, expires: 0, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export const VisionRoomSchema = SchemaFactory.createForClass(VisionRoom);

VisionRoomSchema.index({ code: 1 });
VisionRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
