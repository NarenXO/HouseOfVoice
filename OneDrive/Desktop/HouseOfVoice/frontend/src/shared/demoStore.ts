/**
 * Shared demo store for cross-domain flow connectivity
 * Stores the patient journey state across all domains
 */

export interface DemoState {
  current_user: {
    id: string;
    email: string;
    role: string;
    name: string;
  } | null;
  case_id: string;
  screening_result: any | null;
  selected_therapist_id: string | null;
  booking_id: string | null;
  therapy_plan_id: string | null;
  learning_path_id: string | null;
  session_id: string | null;
}

const STORAGE_KEY = 'houseofvoice_demo_state';

const DEFAULT_STATE: DemoState = {
  current_user: null,
  case_id: 'demo_patient',
  screening_result: null,
  selected_therapist_id: null,
  booking_id: null,
  therapy_plan_id: null,
  learning_path_id: null,
  session_id: null,
};

export const demoStore = {
  getState(): DemoState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load demo state:', e);
    }
    return { ...DEFAULT_STATE };
  },

  setState(updates: Partial<DemoState>): void {
    const current = this.getState();
    const newState = { ...current, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save demo state:', e);
    }
  },

  reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset demo state:', e);
    }
  },

  // Convenience methods for each stage
  setCurrentUser(user: DemoState['current_user']): void {
    this.setState({ current_user: user });
  },

  setScreeningResult(result: DemoState['screening_result']): void {
    this.setState({ screening_result: result });
  },

  setSelectedTherapist(therapistId: string): void {
    this.setState({ selected_therapist_id: therapistId });
  },

  setBooking(bookingId: string): void {
    this.setState({ booking_id: bookingId });
  },

  setTherapyPlan(planId: string): void {
    this.setState({ therapy_plan_id: planId });
  },

  setLearningPath(pathId: string): void {
    this.setState({ learning_path_id: pathId });
  },

  setSession(sessionId: string): void {
    this.setState({ session_id: sessionId });
  },
};
