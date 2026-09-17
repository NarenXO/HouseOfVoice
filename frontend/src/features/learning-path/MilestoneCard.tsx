import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Star } from "lucide-react";
import { Milestone, Exercise } from "./types";
import PracticePanel from "./PracticePanel";

interface MilestoneCardProps {
  milestone: Milestone | null;
  onUnlockMilestone: (milestoneId: string) => void;
  caseId: string;
  onProgressUpdate?: (milestoneId: string, consecutiveSuccesses: number, checkpointReady: boolean) => void;
  onProbeComplete?: () => void;
}

export default function MilestoneCard({ milestone, onUnlockMilestone, caseId, onProgressUpdate, onProbeComplete }: MilestoneCardProps) {
  if (!milestone) {
    return null;
  }

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "locked":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
            Locked
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
            Active
          </span>
        );
      case "trained":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
            Trained
          </span>
        );
      case "generalized":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">
            Generalized
          </span>
        );
      default:
        return null;
    }
  };

  const getBanner = () => {
    if (milestone.status === "active") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-900">Current Focus</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "generalized") {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="text-sm font-medium text-amber-900">Generalized! ⭐</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "locked") {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Complete previous milestone to unlock</span>
            </div>
            <button
              onClick={() => onUnlockMilestone(milestone.id)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-medium transition-colors"
            >
              Unlock Anyway
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Mock exercises for demo
  const mockExercises: Exercise[] = milestone.exercises || [
    { id: "ex1", title: "Practice Set 1", instructions: "Repeat the target sound 10 times", done: milestone.status === "trained" || milestone.status === "generalized" },
    { id: "ex2", title: "Practice Set 2", instructions: "Use the sound in words", done: milestone.status === "generalized" },
    { id: "ex3", title: "Practice Set 3", instructions: "Use the sound in sentences", done: false },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
              <p className="text-gray-600 text-sm">{milestone.goal}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Banner */}
          {getBanner()}

          {/* Practice Panel for active milestones, read-only list for others */}
          {milestone.status === "active" ? (
            <PracticePanel milestone={milestone} caseId={caseId} onProgressUpdate={onProgressUpdate} onProbeComplete={onProbeComplete} />
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Exercises</h4>
              {mockExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="pt-1">
                    {exercise.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{exercise.title}</p>
                    <p className="text-gray-600 text-xs mt-1">{exercise.instructions}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
