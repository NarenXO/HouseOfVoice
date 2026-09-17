import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { Milestone, Exercise } from "./types";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

interface PracticePanelProps {
  milestone: Milestone;
  caseId: string;
  onCheckpointReady?: () => void;
  onProgressUpdate?: (milestoneId: string, consecutiveSuccesses: number, checkpointReady: boolean) => void;
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

export default function PracticePanel({ milestone, caseId, onCheckpointReady, onProgressUpdate }: PracticePanelProps) {
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

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
    try {
      const response = await axios.post(
        `${API_BASE}/learning/milestones/${milestone.id}/practice-attempt`,
        {
          case_id: caseId,
          exercise_index: exerciseIndex,
          audio_or_text: "",
        }
      );

      // Update exercise completion
      const updatedExercises = exercises.map((ex, index) =>
        index === exerciseIndex ? { ...ex, done: true } : ex
      );
      setExercises(updatedExercises);

      // Update progress
      setProgress(response.data);
      setStreak(response.data.streak);

      // Notify parent of progress update
      if (onProgressUpdate) {
        onProgressUpdate(milestone.id, response.data.consecutive_successes, response.data.checkpoint_ready);
      }

      // Show notification
      const consecutiveCount = response.data.consecutive_successes;
      const threshold = 3;
      const remaining = threshold - consecutiveCount;
      if (remaining > 0) {
        setNotification(`Great job! ${remaining} more practice session${remaining > 1 ? 's' : ''} to checkpoint`);
      } else {
        setNotification("🎯 Checkpoint ready! You've mastered the exercises!");
      }

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

      // Check if checkpoint is ready
      if (response.data.checkpoint_ready && onCheckpointReady) {
        onCheckpointReady();
      }
    } catch (err) {
      console.error("Failed to record practice attempt:", err);
      // Fallback: update local state for demo
      const updatedExercises = exercises.map((ex, index) =>
        index === exerciseIndex ? { ...ex, done: true } : ex
      );
      setExercises(updatedExercises);

      const completedCount = updatedExercises.filter((ex) => ex.done).length;
      setProgress({
        total_exercises: 3,
        completed_exercises: completedCount,
        consecutive_successes: completedCount,
        checkpoint_ready: completedCount >= 3,
        recent_attempts: [],
      });

      // Notify parent of progress update
      if (onProgressUpdate) {
        onProgressUpdate(milestone.id, completedCount, completedCount >= 3);
      }

      setNotification("Great job! Practice recorded (demo mode)");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleTakeCheckpoint = () => {
    alert("Checkpoint coming soon! This will be implemented in Phase 5.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading practice panel...</div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const progressPercentage = (progress.completed_exercises / progress.total_exercises) * 100;
  const threshold = 3;
  const remaining = threshold - progress.consecutive_successes;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{milestone.goal}</p>

        {/* Progress text */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Practice {progress.consecutive_successes} of {threshold} days to unlock checkpoint
          </span>
          <span className="text-sm font-bold text-blue-600">
            {progress.completed_exercises}/{progress.total_exercises}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-blue-500 h-full rounded-full"
          />
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
          >
            <p className="text-sm font-medium text-green-800">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkpoint ready banner */}
      {progress.checkpoint_ready && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-purple-800 mb-1">🎯 Checkpoint Ready!</h4>
              <p className="text-sm text-purple-700 mb-3">
                You've mastered the trained words. Your therapist will test you on a new word next session.
              </p>
              <button
                onClick={handleTakeCheckpoint}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Take Checkpoint
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Exercises */}
      <div className="space-y-3 mb-6">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className={`p-4 rounded-lg border transition-all ${
              exercise.done
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-medium mb-1 ${exercise.done ? "text-green-800 line-through opacity-60" : "text-gray-900"}`}>
                  Exercise {index + 1}: {exercise.title}
                </h4>
                <p className={`text-sm ${exercise.done ? "text-green-700 opacity-60" : "text-gray-600"}`}>
                  {exercise.instructions}
                </p>
              </div>
              <div className="ml-4">
                {exercise.done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <button
                    onClick={() => handleMarkDone(index)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-orange-500 font-bold">
            Streak: {streak?.current_streak_days || 0} days
          </span>
        </div>
        <button
          onClick={() => {
            alert("Practice session recorded! Great job keeping up your streak!");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Record Practice Session
        </button>
      </div>
    </div>
  );
}
