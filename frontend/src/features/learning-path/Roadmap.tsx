import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Play, CheckCircle, Star, Sparkles } from "lucide-react";
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

    // Green if both are trained or generalized
    if ((current.status === "trained" || current.status === "generalized") &&
        (next.status === "trained" || next.status === "generalized")) {
      return "bg-green-500";
    }

    // Blue-to-gray gradient if going from active to locked
    if (current.status === "active" && next.status === "locked") {
      return "bg-gradient-to-r from-blue-500 to-gray-300";
    }

    // Gray otherwise
    return "bg-gray-300";
  };

  const getNodeStyles = (milestone: Milestone) => {
    switch (milestone.status) {
      case "locked":
        return {
          bg: "bg-gray-200",
          text: "text-gray-400",
          border: "border-gray-300",
          icon: <Lock className="w-6 h-6" />,
          animation: "",
        };
      case "active":
        return {
          bg: "bg-blue-500",
          text: "text-white",
          border: "border-blue-600",
          icon: <Play className="w-6 h-6" />,
          animation: "animate-pulse",
        };
      case "trained":
        return {
          bg: "bg-green-500",
          text: "text-white",
          border: "border-green-600",
          icon: <CheckCircle className="w-6 h-6" />,
          animation: "",
        };
      case "generalized":
        return {
          bg: "bg-amber-400",
          text: "text-amber-900",
          border: "border-amber-500",
          icon: <Star className="w-6 h-6 fill-amber-900" />,
          animation: "",
        };
      default:
        return {
          bg: "bg-gray-200",
          text: "text-gray-400",
          border: "border-gray-300",
          icon: <Lock className="w-6 h-6" />,
          animation: "",
        };
    }
  };

  const MilestoneNode = ({ milestone, index }: { milestone: Milestone; index: number }) => {
    const styles = getNodeStyles(milestone);
    const isGeneralized = milestone.status === "generalized";
    const isJustCompleted = justGeneralized.has(milestone.id);
    const isTrained = milestone.status === "trained";

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={false}
          animate={{
            rotateY: isJustCompleted ? 360 : 0,
            scale: isJustCompleted ? [1, 1.25, 1] : 1,
          }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
          className="relative cursor-pointer"
        >
          <div
            className={`${styles.bg} ${styles.border} border-4 rounded-full w-20 h-20 flex items-center justify-center ${styles.text} ${styles.animation} shadow-lg hover:scale-110 transition-transform`}
            onClick={() => onMilestoneClick(milestone)}
            onMouseEnter={() => setHoveredMilestone(milestone.id)}
            onMouseLeave={() => setHoveredMilestone(null)}
          >
            {isGeneralized ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-6 h-6 text-amber-500 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </motion.div>
            ) : isTrained ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              styles.icon
            )}

            {/* Unlock button for locked milestones */}
            {milestone.status === "locked" && hoveredMilestone === milestone.id && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-2 bg-white text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-gray-100 border border-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockMilestone(milestone.id);
                }}
                title="Unlock anyway?"
              >
                Unlock Anyway
              </motion.button>
            )}

            {/* Pulsing ring for active milestone */}
            {milestone.status === "active" && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75" />
            )}

            {/* Glow effect for generalized */}
            {isGeneralized && (
              <div className="absolute inset-0 rounded-full shadow-amber-300/50 shadow-lg" />
            )}

            {/* Sparkle burst effect for newly generalized */}
            <AnimatePresence>
              {isJustCompleted && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [1, 1, 0],
                        x: Math.cos((i * 60 * Math.PI) / 180) * 40,
                        y: Math.sin((i * 60 * Math.PI) / 180) * 40,
                      }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
                      style={{ transform: "translate(-50%, -50%)" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Label */}
        <div className={`text-sm font-medium text-center max-w-[100px] ${styles.text}`}>
          {milestone.title}
        </div>

        {/* Progress indicator for active milestones */}
        {milestone.status === "active" && progressData[milestone.id] && (
          <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {progressData[milestone.id].consecutive_successes}/3
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-center gap-2 overflow-x-auto py-8">
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
      <div className="md:hidden flex flex-col items-center gap-2 overflow-y-auto py-8">
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
  );
}
