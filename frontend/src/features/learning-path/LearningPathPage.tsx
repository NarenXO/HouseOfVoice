import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, Flame } from "lucide-react";
import Roadmap from "./Roadmap";
import MilestoneCard from "./MilestoneCard";
import MilestoneEditor from "./MilestoneEditor";
import GeneralizationGauge from "./GeneralizationGauge";
import BadgesShowcase from "./BadgesShowcase";
import { Milestone, LearningPath } from "./types";
import axios from "axios";

const API_BASE = "http://localhost:8000/api"; // Adjust as needed

export default function LearningPathPage() {
  const [activeTab, setActiveTab] = useState<"roadmap" | "edit">("roadmap");
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<{ [milestoneId: string]: { consecutive_successes: number; checkpoint_ready: boolean } }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pathApproved, setPathApproved] = useState(false);
  const [autoFillTrigger, setAutoFillTrigger] = useState(0);

  // Mock case ID - in production this would come from auth context
  const caseId = "case_demo_001";

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      // Try to fetch from API
      const response = await axios.get(`${API_BASE}/learning/paths/${caseId}/roadmap`);
      setLearningPath(response.data);
      setPathApproved(response.data.is_live || false);

      // Fetch progress data for active milestones
      const activeMilestones = response.data.milestones.filter((m: Milestone) => m.status === "active");
      const progressPromises = activeMilestones.map((m: Milestone) =>
        axios.get(`${API_BASE}/learning/milestones/${m.id}/progress`)
      );

      const progressResponses = await Promise.all(progressPromises);
      const newProgressData: { [milestoneId: string]: { consecutive_successes: number; checkpoint_ready: boolean } } = {};

      activeMilestones.forEach((m: Milestone, index: number) => {
        newProgressData[m.id] = {
          consecutive_successes: progressResponses[index].data.consecutive_successes,
          checkpoint_ready: progressResponses[index].data.checkpoint_ready,
        };
      });

      setProgressData(newProgressData);
    } catch (err) {
      // Fallback to mock data
      console.log("API unavailable, using mock data");
      const mockResponse = await fetch("/shared/mocks/learning_path.mock.json");
      const mockData = await mockResponse.json();
      setLearningPath({
        path_id: mockData.pathId,
        case_id: mockData.caseId,
        is_live: false,
        milestones: mockData.milestones.map((m: any) => ({
          id: m.id,
          path_id: m.pathId,
          order_index: m.orderIndex,
          title: m.title,
          goal: m.goal,
          status: m.status,
          linked_demo_id: m.linkedDemoId,
        })),
        streak: { current_streak_days: 2 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
  };

  const handleUnlockMilestone = async (milestoneId: string) => {
    try {
      await axios.post(`${API_BASE}/learning/milestones/${milestoneId}/unlock`, {
        case_id: caseId,
      });

      // Update local state
      if (learningPath) {
        const updatedMilestones = learningPath.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status: "active" as const } : m
        );
        setLearningPath({ ...learningPath, milestones: updatedMilestones });

        // Update selected milestone if it's the one being unlocked
        if (selectedMilestone?.id === milestoneId) {
          setSelectedMilestone({ ...selectedMilestone, status: "active" });
        }
      }
    } catch (err) {
      console.error("Failed to unlock milestone:", err);
      // Fallback: update local state anyway for demo
      if (learningPath) {
        const updatedMilestones = learningPath.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status: "active" as const } : m
        );
        setLearningPath({ ...learningPath, milestones: updatedMilestones });

        if (selectedMilestone?.id === milestoneId) {
          setSelectedMilestone({ ...selectedMilestone, status: "active" });
        }
      }
    }
  };

  const handleProgressUpdate = (milestoneId: string, consecutiveSuccesses: number, checkpointReady: boolean) => {
    setProgressData(prev => ({
      ...prev,
      [milestoneId]: {
        consecutive_successes: consecutiveSuccesses,
        checkpoint_ready: checkpointReady,
      }
    }));
  };

  const handleProbeComplete = () => {
    // Increment refresh key to trigger gauge update
    setRefreshKey(prev => prev + 1);
    // Show celebration banner
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const handleUpdateMilestone = (milestone: Milestone) => {
    if (learningPath) {
      const updatedMilestones = learningPath.milestones.map((m) =>
        m.id === milestone.id ? milestone : m
      );
      setLearningPath({ ...learningPath, milestones: updatedMilestones });
    }
  };

  const handleAddMilestone = () => {
    if (learningPath) {
      const newMilestone: Milestone = {
        id: `m_${Date.now()}`,
        path_id: learningPath.path_id,
        order_index: learningPath.milestones.length + 1,
        title: "New Milestone",
        goal: "Set your goal here",
        status: "locked",
        linked_demo_id: null,
      };
      setLearningPath({
        ...learningPath,
        milestones: [...learningPath.milestones, newMilestone],
      });
    }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (learningPath) {
      const updatedMilestones = learningPath.milestones.filter((m) => m.id !== milestoneId);
      setLearningPath({ ...learningPath, milestones: updatedMilestones });
    }
  };

  const handleApprovePath = async () => {
    try {
      if (learningPath) {
        await axios.post(`${API_BASE}/learning/paths/${learningPath.path_id}/approve`, {
          case_id: caseId,
        });
        setPathApproved(true);
        // Update local state
        setLearningPath({ ...learningPath, is_live: true });
      }
    } catch (err) {
      console.error("Failed to approve path:", err);
      // Fallback: update local state anyway for demo
      setPathApproved(true);
      if (learningPath) {
        setLearningPath({ ...learningPath, is_live: true });
      }
    }
  };

  const handleQuickDemoAutoFill = async () => {
    // Find the active milestone
    let activeMilestone = learningPath?.milestones.find(m => m.status === "active");

    if (!activeMilestone) {
      // If no active milestone, find the first locked one and activate it
      const firstLocked = learningPath?.milestones.find(m => m.status === "locked");
      if (firstLocked && learningPath) {
        // Activate it
        const updatedMilestones = learningPath.milestones.map(m =>
          m.id === firstLocked.id ? { ...m, status: "active" as const } : m
        );
        setLearningPath({ ...learningPath, milestones: updatedMilestones });
        activeMilestone = { ...firstLocked, status: "active" as const };
        setSelectedMilestone(activeMilestone);
      } else {
        // No milestones available
        console.log("No milestones available for auto-fill");
        return;
      }
    }

    // IMMEDIATE local state updates (happen synchronously)
    setProgressData(prev => ({
      ...prev,
      [activeMilestone.id]: {
        consecutive_successes: 3,
        checkpoint_ready: true,
      }
    }));

    // Auto-select the active milestone to show practice panel
    setSelectedMilestone(activeMilestone);

    // Trigger the PracticePanel auto-fill
    setAutoFillTrigger(prev => prev + 1);

    // Try API call but don't wait for it - fire and forget
    axios.post(`${API_BASE}/learning/milestones/${activeMilestone.id}/practice-attempt`, {
      case_id: caseId,
      exercise_index: 0,
      audio_or_text: "auto-fill-demo",
    }).catch(err => {
      console.log("Auto-fill API call failed (non-critical):", err);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading learning path...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No learning path found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>

            {/* Tab Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "roadmap"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🗺️ Patient Roadmap
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "edit"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🩺 Clinician Mode
              </button>
            </div>

            {/* Quick Demo Auto-Fill Button */}
            {activeTab === "roadmap" && (
              <button
                onClick={handleQuickDemoAutoFill}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Zap className="w-4 h-4" />
                ⚡ Quick Demo Auto-Fill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "roadmap" ? (
          <div>
            {/* Generalization Gauge - Prominent Position */}
            <div className="mb-6">
              <GeneralizationGauge caseId={caseId} refreshTrigger={refreshKey} />
            </div>

            {/* Streak Banner */}
            {learningPath.streak && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-6 text-white shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="text-4xl"
                  >
                    🔥
                  </motion.div>
                  <div>
                    <div className="font-bold text-2xl">{learningPath.streak.current_streak_days} Day Streak!</div>
                    <div className="text-sm opacity-90">Practice today to keep your streak alive!</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Roadmap */}
            <Roadmap
              milestones={learningPath.milestones}
              onMilestoneClick={handleMilestoneClick}
              onUnlockMilestone={handleUnlockMilestone}
              progressData={progressData}
              refreshTrigger={refreshKey}
            />

            {/* Badges Showcase */}
            <BadgesShowcase caseId={caseId} refreshTrigger={refreshKey} />

            {/* Celebration Banner */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl p-4 mb-6 text-center shadow-lg"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <span className="font-bold text-lg">Amazing Work! You earned a new badge!</span>
                    <span className="text-2xl">🎉</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Milestone Detail Card */}
            <MilestoneCard
              milestone={selectedMilestone}
              onUnlockMilestone={handleUnlockMilestone}
              caseId={caseId}
              onProgressUpdate={handleProgressUpdate}
              onProbeComplete={handleProbeComplete}
              autoFillTrigger={autoFillTrigger}
            />
          </div>
        ) : (
          <div className="relative">
            <MilestoneEditor
              milestones={learningPath.milestones}
              onUpdateMilestone={handleUpdateMilestone}
              onAddMilestone={handleAddMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              disabled={pathApproved}
            />

            {/* Sticky Approve Button */}
            {!pathApproved && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-center">
                  <button
                    onClick={handleApprovePath}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-md"
                  >
                    ✅ Approve & Lock Path
                  </button>
                </div>
              </div>
            )}

            {/* Path Approved Banner */}
            {pathApproved && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 shadow-lg"
              >
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                  <span className="text-2xl">✅</span>
                  <span className="font-bold text-lg">Path is Live & Approved</span>
                  <span className="text-2xl">🎉</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
