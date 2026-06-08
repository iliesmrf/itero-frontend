export type VisionStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface VisionParticipant {
  id: string;
  name: string;
  color: string;
  avatar: string;
  joinedAt: number;
}

export interface VisionContribution {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface VisionRoom {
  code: string;
  step: VisionStep;
  participants: Record<string, VisionParticipant>;
  templateId: string | null;
  contributions: Record<string, Record<string, VisionContribution>>;
  votes: Record<string, Record<string, string[]>>;
  synthesis: Record<string, string>;
  createdAt: number;
}
