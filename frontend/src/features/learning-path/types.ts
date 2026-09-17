export type MilestoneStatus = "locked" | "active" | "trained" | "generalized";

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  done: boolean;
}

export interface Milestone {
  id: string;
  path_id: string;
  order_index: number;
  title: string;
  goal: string;
  status: MilestoneStatus;
  linked_demo_id: string | null;
  exercises?: Exercise[];
}

export interface LearningPath {
  path_id: string;
  case_id: string;
  is_live: boolean;
  milestones: Milestone[];
  streak?: {
    current_streak_days: number;
  };
}
