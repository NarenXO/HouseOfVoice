import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Play, CheckCircle, Star } from "lucide-react";
import { Milestone } from "./types";

interface RoadmapProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  onUnlockMilestone: (milestoneId: string) => void;
}

export default function Roadmap({ milestones, onMilestoneClick, onUnlockMilestone }: RoadmapProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

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

  return (
    <div className="w-full">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-center gap-2 overflow-x-auto py-8">
        {sortedMilestones.map((milestone, index) => {
          const styles = getNodeStyles(milestone);
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
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`relative cursor-pointer ${styles.bg} ${styles.border} border-4 rounded-full w-20 h-20 flex items-center justify-center ${styles.text} ${styles.animation} shadow-lg hover:scale-110 transition-transform`}
                  onClick={() => onMilestoneClick(milestone)}
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {styles.icon}

                  {/* Unlock button for locked milestones */}
                  {milestone.status === "locked" && hoveredMilestone === milestone.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -bottom-2 bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-semibold shadow-md hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockMilestone(milestone.id);
                      }}
                      title="Unlock anyway?"
                    >
                      Unlock
                    </motion.button>
                  )}

                  {/* Pulsing ring for active milestone */}
                  {milestone.status === "active" && (
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75" />
                  )}

                  {/* Glow effect for generalized */}
                  {milestone.status === "generalized" && (
                    <div className="absolute inset-0 rounded-full shadow-amber-300/50 shadow-lg" />
                  )}
                </div>

                {/* Label */}
                <div className={`text-sm font-medium text-center max-w-[100px] ${styles.text}`}>
                  {milestone.title}
                </div>
              </div>

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
          const styles = getNodeStyles(milestone);
          const isLast = index === sortedMilestones.length - 1;

          return (
            <div key={milestone.id} className="flex flex-col items-center">
              {/* Milestone node */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`relative cursor-pointer ${styles.bg} ${styles.border} border-4 rounded-full w-20 h-20 flex items-center justify-center ${styles.text} ${styles.animation} shadow-lg hover:scale-110 transition-transform`}
                  onClick={() => onMilestoneClick(milestone)}
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {styles.icon}

                  {/* Unlock button for locked milestones */}
                  {milestone.status === "locked" && hoveredMilestone === milestone.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -bottom-2 bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-semibold shadow-md hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockMilestone(milestone.id);
                      }}
                      title="Unlock anyway?"
                    >
                      Unlock
                    </motion.button>
                  )}

                  {/* Pulsing ring for active milestone */}
                  {milestone.status === "active" && (
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75" />
                  )}

                  {/* Glow effect for generalized */}
                  {milestone.status === "generalized" && (
                    <div className="absolute inset-0 rounded-full shadow-amber-300/50 shadow-lg" />
                  )}
                </div>

                {/* Label */}
                <div className={`text-sm font-medium text-center max-w-[100px] ${styles.text}`}>
                  {milestone.title}
                </div>
              </div>

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
