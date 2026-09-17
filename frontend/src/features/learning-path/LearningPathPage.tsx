import { useState, useEffect } from "react";
import Roadmap from "./Roadmap";
import MilestoneCard from "./MilestoneCard";
import MilestoneEditor from "./MilestoneEditor";
import GeneralizationGauge from "./GeneralizationGauge";
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>

            {/* Tab Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "roadmap"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                My Roadmap
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "edit"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Edit Path
              </button>
            </div>
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 mb-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">🔥 {learningPath.streak.current_streak_days}</div>
                  <div>
                    <div className="font-semibold">Day Streak!</div>
                    <div className="text-sm opacity-90">Keep up the great work</div>
                  </div>
                </div>
              </div>
            )}

            {/* Roadmap */}
            <Roadmap
              milestones={learningPath.milestones}
              onMilestoneClick={handleMilestoneClick}
              onUnlockMilestone={handleUnlockMilestone}
              progressData={progressData}
            />

            {/* Milestone Detail Card */}
            <MilestoneCard
              milestone={selectedMilestone}
              onUnlockMilestone={handleUnlockMilestone}
              caseId={caseId}
              onProgressUpdate={handleProgressUpdate}
              onProbeComplete={handleProbeComplete}
            />
          </div>
        ) : (
          <MilestoneEditor
            milestones={learningPath.milestones}
            onUpdateMilestone={handleUpdateMilestone}
            onAddMilestone={handleAddMilestone}
            onDeleteMilestone={handleDeleteMilestone}
          />
        )}
      </div>
    </div>
  );
}
