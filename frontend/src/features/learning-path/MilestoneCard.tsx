import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Award } from "lucide-react";
import { Milestone, Exercise } from "./types";
import PracticePanel from "./PracticePanel";

interface MilestoneCardProps {
  milestone: Milestone | null;
  onUnlockMilestone: (milestoneId: string) => void;
  caseId: string;
  onProgressUpdate?: (milestoneId: string, consecutiveSuccesses: number, checkpointReady: boolean) => void;
  onProbeComplete?: () => void;
  autoFillTrigger?: number;
}

export default function MilestoneCard({ milestone, onUnlockMilestone, caseId, onProgressUpdate, onProbeComplete, autoFillTrigger }: MilestoneCardProps) {
  if (!milestone) {
    return null;
  }

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "locked":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1]">
            Locked
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1E3A5F] text-white">
            Active
          </span>
        );
      case "trained":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#16A34A] text-white">
            Trained
          </span>
        );
      case "generalized":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0D9488] text-white">
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
        <div className="bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#0D9488] rounded-full" />
            <span className="text-sm font-semibold text-[#0F172A]">Current focus</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "generalized") {
      return (
        <div className="bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0D9488]" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-[#0F172A]">Generalized</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "locked") {
      return (
        <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
              <span className="text-sm text-[#475569]">Complete previous milestone to unlock</span>
            </div>
            <button
              onClick={() => onUnlockMilestone(milestone.id)}
              className="px-3 py-1 bg-white hover:bg-[#F4F6F8] text-[#0F172A] border border-[#CBD5E1] rounded-full text-xs font-semibold transition-colors"
            >
              Unlock
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
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full"
      >
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] shadow-sm p-6 mt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-1">{milestone.title}</h3>
              <p className="text-[#475569] text-base">{milestone.goal}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Banner */}
          {getBanner()}

          {/* Practice Panel for active milestones, read-only list for others */}
          {milestone.status === "active" ? (
            <PracticePanel milestone={milestone} caseId={caseId} onProgressUpdate={onProgressUpdate} onProbeComplete={onProbeComplete} autoFillTrigger={autoFillTrigger} />
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#475569] mb-2">Exercises</h4>
              {mockExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-start gap-3 p-4 bg-[#F1F5F9] rounded-lg"
                >
                  <div className="pt-1">
                    {exercise.done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" strokeWidth={1.75} />
                    ) : (
                      <div className="w-5 h-5 border-2 border-[#CBD5E1] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0F172A] text-base">{exercise.title}</p>
                    <p className="text-[#475569] text-sm mt-1">{exercise.instructions}</p>
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
