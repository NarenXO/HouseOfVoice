import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Target, CheckCircle2, Award } from "lucide-react";
import { Milestone } from "./types";

interface RoadmapProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  onUnlockMilestone: (milestoneId: string) => void;
  progressData?: { [milestoneId: string]: { consecutive_successes: number; checkpoint_ready: boolean } };
  refreshTrigger?: number;
}

export default function Roadmap({ milestones, onMilestoneClick, onUnlockMilestone, progressData = {}, refreshTrigger = 0 }: RoadmapProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);
  const [justGeneralized, setJustGeneralized] = useState<Set<string>>(new Set());

  // Track milestones that just became generalized for animation
  useEffect(() => {
    const generalizedIds = milestones
      .filter(m => m.status === "generalized")
      .map(m => m.id);
    
    setJustGeneralized(new Set(generalizedIds));
    
    // Clear the "just generalized" state after animation completes
    const timer = setTimeout(() => {
      setJustGeneralized(new Set());
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [milestones, refreshTrigger]);

  // Sort milestones by order_index
  const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);

  const getConnectorColor = (currentIndex: number, nextIndex: number) => {
    const current = sortedMilestones[currentIndex];
    const next = sortedMilestones[nextIndex];

    if ((current.status === "trained" || current.status === "generalized") &&
        (next.status === "trained" || next.status === "generalized")) {
      return "bg-[#34D399]";
    }

    if (current.status === "active" || current.status === "trained" || current.status === "generalized") {
      return "bg-[#34D399]";
    }

    return "bg-[#047857]";
  };

  const getNodeStyles = (milestone: Milestone) => {
    switch (milestone.status) {
      case "locked":
        return {
          bg: "bg-[#022C22]",
          text: "text-[#059669]",
          border: "border border-[#059669]",
          icon: <Lock className="w-6 h-6 text-[#059669]" strokeWidth={1.75} />,
        };
      case "active":
        return {
          bg: "bg-[#047857]",
          text: "text-white",
          border: "border-2 border-[#34D399]",
          icon: <Target className="w-6 h-6 text-white" strokeWidth={1.75} />,
        };
      case "trained":
        return {
          bg: "bg-[#059669]",
          text: "text-white",
          border: "border border-[#34D399]",
          icon: <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={1.75} />,
        };
      case "generalized":
        return {
          bg: "bg-[#0D9488]",
          text: "text-white",
          border: "border border-[#34D399]",
          icon: <Award className="w-6 h-6 text-white" strokeWidth={1.75} />,
        };
      default:
        return {
          bg: "bg-[#022C22]",
          text: "text-[#059669]",
          border: "border border-[#059669]",
          icon: <Lock className="w-6 h-6 text-[#059669]" strokeWidth={1.75} />,
        };
    }
  };

  const MilestoneNode = ({ milestone }: { milestone: Milestone; index: number }) => {
    const styles = getNodeStyles(milestone);
    const isGeneralized = milestone.status === "generalized";
    const isJustCompleted = justGeneralized.has(milestone.id);
    const isTrained = milestone.status === "trained";

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={false}
          animate={{
            opacity: isJustCompleted ? [0.8, 1] : 1,
            scale: isJustCompleted ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative cursor-pointer"
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${styles.bg} ${styles.border} ${styles.text} shadow-sm hover:scale-105 transition-transform`}
            onClick={() => onMilestoneClick(milestone)}
            onMouseEnter={() => setHoveredMilestone(milestone.id)}
            onMouseLeave={() => setHoveredMilestone(null)}
          >
            {isGeneralized ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Award className="w-6 h-6 text-white" strokeWidth={1.75} />
              </motion.div>
            ) : isTrained ? (
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={1.75} />
            ) : (
              styles.icon
            )}

            {/* Unlock button for locked milestones */}
            {milestone.status === "locked" && hoveredMilestone === milestone.id && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute -bottom-2 bg-white text-[#064E3B] px-3 py-1 rounded-full text-xs font-black shadow-sm hover:bg-[#CCFBF1] border border-[#0D9488]"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockMilestone(milestone.id);
                }}
                title="Unlock milestone"
              >
                Unlock
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Label */}
        <div className="text-sm font-extrabold text-center max-w-[100px] text-white">
          {milestone.title}
        </div>

        {/* Progress indicator for active milestones */}
        {milestone.status === "active" && progressData[milestone.id] && (
          <div className="bg-[#022C22] text-[#34D399] border border-[#059669] font-black px-3 py-1 rounded-full text-xs">
            {progressData[milestone.id].consecutive_successes}/3
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Section Label */}
      <div className="mb-1.5">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#A7F3D0]">MILESTONES</h3>
      </div>

      {/* Roadmap Container Card */}
      <div className="bg-[#064E3B] border-2 border-[#0D9488] rounded-[16px] p-6 shadow-md">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center justify-center gap-2 overflow-x-auto py-6">
          {sortedMilestones.map((milestone, index) => {
            const isLast = index === sortedMilestones.length - 1;

            return (
              <div key={milestone.id} className="flex items-center">
                {/* Connector line (before node, except for first) */}
                {index > 0 && (
                  <div
                    className={`w-16 h-1 ${getConnectorColor(index - 1, index)} rounded-full`}
                  />
                )}

                {/* Milestone node */}
                <MilestoneNode milestone={milestone} index={index} />

                {/* Connector line (after node, except for last) */}
                {!isLast && (
                  <div
                    className={`w-16 h-1 ${getConnectorColor(index, index + 1)} rounded-full`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical layout */}
        <div className="md:hidden flex flex-col items-center gap-2 overflow-y-auto py-6">
          {sortedMilestones.map((milestone, index) => {
            const isLast = index === sortedMilestones.length - 1;

            return (
              <div key={milestone.id} className="flex flex-col items-center">
                {/* Milestone node */}
                <MilestoneNode milestone={milestone} index={index} />

                {/* Connector line (vertical, except for last) */}
                {!isLast && (
                  <div
                    className={`w-1 h-12 ${getConnectorColor(index, index + 1)} rounded-full my-2`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
