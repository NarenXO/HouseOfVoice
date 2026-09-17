import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Target, Zap } from "lucide-react";
import { Milestone, Exercise } from "./types";
import axios from "axios";
import ProbeSession from "./ProbeSession";

const API_BASE = "http://localhost:8000/api";

interface PracticePanelProps {
  milestone: Milestone;
  caseId: string;
  onCheckpointReady?: () => void;
  onProgressUpdate?: (milestoneId: string, consecutiveSuccesses: number, checkpointReady: boolean) => void;
  onProbeComplete?: () => void;
  autoFillTrigger?: number;
}

interface PracticeProgress {
  total_exercises: number;
  completed_exercises: number;
  consecutive_successes: number;
  checkpoint_ready: boolean;
  recent_attempts: any[];
}

interface StreakData {
  current_streak_days: number;
  last_practice_date: string | null;
}

export default function PracticePanel({ milestone, caseId, onCheckpointReady, onProgressUpdate, onProbeComplete, autoFillTrigger }: PracticePanelProps) {
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showProbeSession, setShowProbeSession] = useState(false);

  // Mock exercises for the milestone
  const mockExercises: Exercise[] = [
    { id: "ex1", title: "Say 'sun' five times slowly", instructions: "Repeat the word 'sun' slowly, focusing on the /s/ sound", done: false },
    { id: "ex2", title: "Practice 'sock' in a sentence", instructions: "Use the word 'sock' in a sentence like 'I put on my sock'", done: false },
    { id: "ex3", title: "Read the 's' word list", instructions: "Read the list of words: sun, soap, soup, sand, sock", done: false },
  ];

  useEffect(() => {
    // Initialize exercises
    setExercises(mockExercises);
    fetchProgress();
  }, [milestone.id]);

  // Handle auto-fill trigger from parent
  useEffect(() => {
    if (autoFillTrigger && autoFillTrigger > 0) {
      handleAutoFill();
    }
  }, [autoFillTrigger]);

  const handleAutoFill = () => {
    // IMMEDIATE local state updates (synchronous)
    const updatedExercises = mockExercises.map((ex) => ({ ...ex, done: true }));
    setExercises(updatedExercises);
    setProgress({
      total_exercises: 3,
      completed_exercises: 3,
      consecutive_successes: 3,
      checkpoint_ready: true,
      recent_attempts: [],
    });

    // Notify parent immediately
    if (onProgressUpdate) {
      onProgressUpdate(milestone.id, 3, true);
    }

    setNotification("Practice session completed");
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/learning/milestones/${milestone.id}/progress`);
      setProgress(response.data);

      // Fetch streak data
      const streakResponse = await axios.get(`${API_BASE}/learning/paths/${caseId}/roadmap`);
      setStreak(streakResponse.data.streak);

      // Update exercise completion status based on progress
      if (response.data.completed_exercises > 0) {
        const updatedExercises = mockExercises.map((ex, index) => ({
          ...ex,
          done: index < response.data.completed_exercises,
        }));
        setExercises(updatedExercises);
      }
    } catch (err) {
      console.error("Failed to fetch progress:", err);
      // Set default progress for demo
      setProgress({
        total_exercises: 3,
        completed_exercises: 0,
        consecutive_successes: 0,
        checkpoint_ready: false,
        recent_attempts: [],
      });
      setStreak({ current_streak_days: 0, last_practice_date: null });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (exerciseIndex: number) => {
    // IMMEDIATE local state updates (happen synchronously)
    const updatedExercises = exercises.map((ex, index) =>
      index === exerciseIndex ? { ...ex, done: true } : ex
    );
    setExercises(updatedExercises);

    const completedCount = updatedExercises.filter((ex) => ex.done).length;
    const checkpointReady = completedCount >= 3;

    // Update progress immediately
    setProgress({
      total_exercises: 3,
      completed_exercises: completedCount,
      consecutive_successes: completedCount,
      checkpoint_ready: checkpointReady,
      recent_attempts: [],
    });

    // Notify parent immediately
    if (onProgressUpdate) {
      onProgressUpdate(milestone.id, completedCount, checkpointReady);
    }

    // Show notification immediately
    const threshold = 3;
    const remaining = threshold - completedCount;
    if (remaining > 0) {
      setNotification(`${remaining} more practice session${remaining > 1 ? 's' : ''} to checkpoint`);
    } else {
      setNotification("Checkpoint ready");
    }

    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);

    // Check if checkpoint is ready immediately
    if (checkpointReady && onCheckpointReady) {
      onCheckpointReady();
    }

    // Try API call but don't wait for it - fire and forget
    axios.post(
      `${API_BASE}/learning/milestones/${milestone.id}/practice-attempt`,
      {
        case_id: caseId,
        exercise_index: exerciseIndex,
        audio_or_text: "",
      }
    ).then(response => {
      // Update with server response if successful
      setProgress(response.data);
      setStreak(response.data.streak);
      if (onProgressUpdate) {
        onProgressUpdate(milestone.id, response.data.consecutive_successes, response.data.checkpoint_ready);
      }
    }).catch(err => {
      console.log("Practice attempt API call failed (non-critical):", err);
    });
  };

  const handleTakeCheckpoint = () => {
    setShowProbeSession(true);
  };

  const handleProbeComplete = (status: "generalized" | "trained", extraItems?: string[]) => {
    setShowProbeSession(false);

    // Trigger gauge refresh
    if (onProbeComplete) {
      onProbeComplete();
    }

    if (status === "generalized") {
      // Refresh roadmap and milestone cards
      if (onProgressUpdate) {
        onProgressUpdate(milestone.id, 3, false); // Reset checkpoint ready
      }
      // Trigger parent refresh if available
      window.location.reload(); // Simple refresh for demo
    } else if (status === "trained" && extraItems) {
      // Append extra practice items to exercise list and reset progress
      const extraExercises: Exercise[] = extraItems.map((word, index) => ({
        id: `extra_${index}`,
        title: `Practice "${word}"`,
        instructions: `Say "${word}" clearly out loud to reinforce the sound`,
        done: false,
      }));

      setExercises([...exercises, ...extraExercises]);
      // Reset progress by fetching fresh data
      setTimeout(() => fetchProgress(), 100);

      if (onProgressUpdate) {
        onProgressUpdate(milestone.id, 0, false);
      }
    }
  };

  const handleProbeCancel = () => {
    setShowProbeSession(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 font-medium">Loading practice panel...</div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  // Show probe session if active
  if (showProbeSession) {
    // Extract phoneme from milestone title (e.g., "s - start of words" -> "/s/")
    const phonemeMatch = milestone.title.match(/^([a-z]+)/);
    const phoneme = phonemeMatch ? `/${phonemeMatch[1]}/` : "/s/";

    return (
      <ProbeSession
        milestoneId={milestone.id}
        caseId={caseId}
        phoneme={phoneme}
        onComplete={handleProbeComplete}
        onCancel={handleProbeCancel}
      />
    );
  }

  const progressPercentage = (progress.completed_exercises / progress.total_exercises) * 100;
  const threshold = 3;
  const remaining = threshold - progress.consecutive_successes;

  return (
    <div className="bg-[#064E3B] border-2 border-[#0D9488] rounded-[16px] shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-black text-white tracking-tight mb-1">{milestone.title}</h3>
        <p className="text-sm font-bold text-[#D1FAE5] mb-4">{milestone.goal}</p>

        {/* Progress text */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-extrabold text-white">
            Practice {progress.consecutive_successes} of {threshold} days to unlock checkpoint
          </span>
          <span className="text-sm font-black text-[#CCFBF1] tabular-nums">
            {progress.completed_exercises}/{progress.total_exercises}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#022C22] h-2.5 rounded-full overflow-hidden border border-[#059669]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-[#34D399] h-2.5 rounded-full"
          />
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-[#022C22] border border-[#059669] rounded-lg p-3 mb-4 shadow-sm"
          >
            <p className="text-sm font-extrabold text-white">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkpoint ready banner */}
      {progress.checkpoint_ready && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#022C22] border-2 border-[#059669] text-white rounded-[12px] p-4 mb-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#064E3B] border border-[#0D9488] rounded-full flex-shrink-0">
              <Target className="w-6 h-6 text-[#34D399]" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-white text-lg mb-1">Checkpoint ready</h4>
              <p className="text-sm font-extrabold text-[#D1FAE5] mb-4">
                You have completed the required practice sessions. Take the generalization probe to assess progress.
              </p>
              <button
                onClick={handleTakeCheckpoint}
                className="bg-white hover:bg-[#CCFBF1] text-[#064E3B] font-black rounded-lg px-4 py-2 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Target className="w-5 h-5 text-[#064E3B]" strokeWidth={1.75} />
                Take probe checkpoint
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Exercises */}
      <div className="space-y-4 mb-6">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="bg-[#022C22] border border-[#059669] rounded-[12px] p-4 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-black mb-1.5 ${exercise.done ? "text-[#34D399] line-through opacity-80 text-base" : "text-base font-black text-white"}`}>
                  Exercise {index + 1}: {exercise.title}
                </h4>
                <p className={`text-base font-extrabold ${exercise.done ? "text-[#D1FAE5] opacity-80" : "text-[#D1FAE5]"}`}>
                  {exercise.instructions}
                </p>
              </div>
              <div className="ml-4">
                {exercise.done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center w-9 h-9 bg-[#34D399] rounded-full"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#022C22]" strokeWidth={2} />
                  </motion.div>
                ) : (
                  <button
                    onClick={() => handleMarkDone(index)}
                    className="bg-white hover:bg-[#CCFBF1] text-[#064E3B] font-black rounded-lg px-4 py-2 transition-colors shadow-sm"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak and CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-[#0D9488]">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#F59E0B]" strokeWidth={1.75} />
          <span className="text-white font-black text-sm tabular-nums">
            Streak: {streak?.current_streak_days || 0} days
          </span>
        </div>
        <button
          onClick={() => {
            setNotification("Practice session recorded");
            setTimeout(() => setNotification(null), 3000);
          }}
          className="bg-white hover:bg-[#CCFBF1] text-[#064E3B] font-black rounded-lg px-4 py-2 shadow-sm transition-colors"
        >
          Record Practice Session
        </button>
      </div>
    </div>
  );
}
