export type PIStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PIParticipant {
  id: string;
  name: string;
  color: string;
  avatar: string;
  joinedAt: number;
}

export interface PIConfig {
  name: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
}

export interface PISprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface PIStory {
  id: string;
  title: string;
  points: number;
  priority: string;
  sprintId: string;
  author: string;
  createdAt: number;
}

export interface PIRisk {
  id: string;
  title: string;
  level: string;
  mitigation: string;
  author: string;
  createdAt: number;
}

export interface PIRoom {
  code: string;
  step: PIStep;
  participants: Record<string, PIParticipant>;
  config: PIConfig | null;
  sprints: PISprint[];
  capacity: Record<string, Record<string, number>>;
  stories: Record<string, PIStory>;
  risks: Record<string, PIRisk>;
  confidence: Record<string, number>;
  createdAt: number;
}
