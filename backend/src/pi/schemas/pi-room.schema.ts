import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PIStep, PIParticipant, PIConfig, PISprint, PIStory, PIRisk } from '../pi.types';

export type PIRoomDocument = PIRoom & Document;

@Schema({ timestamps: true })
export class PIRoom {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: Number, default: 0 })
  step: PIStep;

  @Prop({ type: Object, default: {} })
  participants: Record<string, PIParticipant>;

  @Prop({ type: Object, default: null })
  config: PIConfig | null;

  @Prop({ type: Array, default: [] })
  sprints: PISprint[];

  @Prop({ type: Object, default: {} })
  capacity: Record<string, Record<string, number>>;

  @Prop({ type: Object, default: {} })
  stories: Record<string, PIStory>;

  @Prop({ type: Object, default: {} })
  risks: Record<string, PIRisk>;

  @Prop({ type: Object, default: {} })
  confidence: Record<string, number>;

  @Prop({ type: Number, default: Date.now })
  createdAt: number;

  @Prop({ type: Date, expires: 0, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export const PIRoomSchema = SchemaFactory.createForClass(PIRoom);

PIRoomSchema.index({ code: 1 });
PIRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
