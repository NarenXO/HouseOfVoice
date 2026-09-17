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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1]">
            Locked
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#1E3A5F] text-white">
            Active
          </span>
        );
      case "trained":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#16A34A] text-white">
            Trained
          </span>
        );
      case "generalized":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#059669] text-white">
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
        <div className="bg-[#064E3B] border border-[#0D9488] rounded-[12px] p-3 mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#34D399] rounded-full" />
            <span className="text-sm font-extrabold text-white">Current focus</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "generalized") {
      return (
        <div className="bg-[#064E3B] border border-[#0D9488] rounded-[12px] p-3 mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#34D399]" strokeWidth={1.75} />
            <span className="text-sm font-extrabold text-white">Generalized</span>
          </div>
        </div>
      );
    }

    if (milestone.status === "locked") {
      return (
        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
              <span className="text-sm font-bold text-[#1E293B]">Complete previous milestone to unlock</span>
            </div>
            <button
              onClick={() => onUnlockMilestone(milestone.id)}
              className="px-3 py-1 bg-white hover:bg-[#F0FDF4] text-[#022C22] border border-[#059669] rounded-full text-xs font-bold transition-colors"
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
        <div className="bg-white border-2 border-[#059669] rounded-[16px] shadow-sm p-6 mt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-black text-[#022C22] tracking-tight mb-1">{milestone.title}</h3>
              <p className="text-sm font-bold text-[#1E293B]">{milestone.goal}</p>
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
              <h4 className="text-xs font-black uppercase tracking-widest text-[#047857] mb-2">EXERCISES</h4>
              {mockExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-start gap-3 p-4 bg-[#064E3B] border border-[#0D9488] rounded-[12px] shadow-sm"
                >
                  <div className="pt-1">
                    {exercise.done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#34D399]" strokeWidth={2} />
                    ) : (
                      <div className="w-5 h-5 border-2 border-[#0D9488] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white text-base">{exercise.title}</p>
                    <p className="text-base font-extrabold text-[#CCFBF1] mt-1">{exercise.instructions}</p>
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
