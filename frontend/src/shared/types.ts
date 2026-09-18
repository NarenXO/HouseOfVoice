/* FROZEN — DO NOT EDIT during 24h build */

export type Role = "patient" | "guardian" | "therapist" | "supervisor";

export type ReadingAbility = "pre_reader" | "developing" | "fluent";
export type TypingAbility = "none" | "developing" | "fluent";
export type CommunicationMethod = "voice" | "text" | "images";
export type ComfortLevel = "low" | "medium" | "high";

export interface CommunicationProfile {
  primary_language: string;
  secondary_language?: string;
  preferred_therapy_language: string;
  reading_ability: ReadingAbility;
  typing_ability: TypingAbility;
  preferred_communication_method: CommunicationMethod;
  guardian_assistance_required: boolean;
  comfort_with_unfamiliar_people: ComfortLevel;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  communication_profile?: CommunicationProfile;
}

export interface ScreeningResult {
  case_id: string;
  overall_severity: string;
  phoneme_scores: Record<string, number>;
  fluency_score: number;
  language_score: number;
  recommendations: string[];
  created_at: string;
}

export interface Milestone {
  id: string;
  phoneme: string;
  target: string;
  current_level: string;
  status: "not_started" | "in_progress" | "mastered";
}

export interface ProbeResult {
  milestone_id: string;
  score: number;
  attempts: number;
  passed: boolean;
  timestamp: string;
}

export interface GeneralizationScore {
  case_id: string;
  phoneme: string;
  context_scores: Record<string, number>;
  overall: number;
}

export interface SessionRecord {
  session_id: string;
  case_id: string;
  therapist_id: string;
  duration_minutes: number;
  activities_completed: string[];
  notes: string;
  created_at: string;
}

export interface ModuleLibraryEntry {
  id: string;
  phoneme: string;
  age_band: string;
  language: string;
  title: string;
  description: string;
  storyboard_url?: string;
  approved: boolean;
}