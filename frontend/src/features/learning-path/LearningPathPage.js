import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, CheckCircle2 } from "lucide-react";
import Roadmap from "./Roadmap";
import MilestoneCard from "./MilestoneCard";
import MilestoneEditor from "./MilestoneEditor";
import GeneralizationGauge from "./GeneralizationGauge";
import BadgesShowcase from "./BadgesShowcase";
import axios from "axios";
const API_BASE = "http://localhost:8000/api"; // Adjust as needed
export default function LearningPathPage() {
    const [activeTab, setActiveTab] = useState("roadmap");
    const [learningPath, setLearningPath] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progressData, setProgressData] = useState({});
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
            const activeMilestones = response.data.milestones.filter((m) => m.status === "active");
            const progressPromises = activeMilestones.map((m) => axios.get(`${API_BASE}/learning/milestones/${m.id}/progress`));
            const progressResponses = await Promise.all(progressPromises);
            const newProgressData = {};
            activeMilestones.forEach((m, index) => {
                newProgressData[m.id] = {
                    consecutive_successes: progressResponses[index].data.consecutive_successes,
                    checkpoint_ready: progressResponses[index].data.checkpoint_ready,
                };
            });
            setProgressData(newProgressData);
        }
        catch (err) {
            // Fallback to mock data
            console.log("API unavailable, using mock data");
            const mockResponse = await fetch("/shared/mocks/learning_path.mock.json");
            const mockData = await mockResponse.json();
            setLearningPath({
                path_id: mockData.pathId,
                case_id: mockData.caseId,
                is_live: false,
                milestones: mockData.milestones.map((m) => ({
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
        }
        finally {
            setLoading(false);
        }
    };
    const handleMilestoneClick = (milestone) => {
        setSelectedMilestone(milestone);
    };
    const handleUnlockMilestone = async (milestoneId) => {
        try {
            await axios.post(`${API_BASE}/learning/milestones/${milestoneId}/unlock`, {
                case_id: caseId,
            });
            // Update local state
            if (learningPath) {
                const updatedMilestones = learningPath.milestones.map((m) => m.id === milestoneId ? { ...m, status: "active" } : m);
                setLearningPath({ ...learningPath, milestones: updatedMilestones });
                // Update selected milestone if it's the one being unlocked
                if (selectedMilestone?.id === milestoneId) {
                    setSelectedMilestone({ ...selectedMilestone, status: "active" });
                }
            }
        }
        catch (err) {
            console.error("Failed to unlock milestone:", err);
            // Fallback: update local state anyway for demo
            if (learningPath) {
                const updatedMilestones = learningPath.milestones.map((m) => m.id === milestoneId ? { ...m, status: "active" } : m);
                setLearningPath({ ...learningPath, milestones: updatedMilestones });
                if (selectedMilestone?.id === milestoneId) {
                    setSelectedMilestone({ ...selectedMilestone, status: "active" });
                }
            }
        }
    };
    const handleProgressUpdate = (milestoneId, consecutiveSuccesses, checkpointReady) => {
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
    const handleUpdateMilestone = (milestone) => {
        if (learningPath) {
            const updatedMilestones = learningPath.milestones.map((m) => m.id === milestone.id ? milestone : m);
            setLearningPath({ ...learningPath, milestones: updatedMilestones });
        }
    };
    const handleAddMilestone = () => {
        if (learningPath) {
            const newMilestone = {
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
    const handleDeleteMilestone = (milestoneId) => {
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
        }
        catch (err) {
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
                const updatedMilestones = learningPath.milestones.map(m => m.id === firstLocked.id ? { ...m, status: "active" } : m);
                setLearningPath({ ...learningPath, milestones: updatedMilestones });
                activeMilestone = { ...firstLocked, status: "active" };
                setSelectedMilestone(activeMilestone);
            }
            else {
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
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-gray-500", children: "Loading learning path..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-red-500", children: ["Error: ", error] }) }));
    }
    if (!learningPath) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-gray-500", children: "No learning path found" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#F4F6F8] text-[#0F172A] p-6", children: [_jsx("div", { className: "bg-white border-b border-[#CBD5E1] sticky top-0 z-50", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsx("h1", { className: "text-2xl font-bold text-[#0F172A]", children: "Learning path" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setActiveTab("roadmap"), className: `px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "roadmap"
                                            ? "bg-[#1E3A5F] text-white"
                                            : "bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F4F6F8]"}`, children: "Patient Roadmap" }), _jsx("button", { onClick: () => setActiveTab("edit"), className: `px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "edit"
                                            ? "bg-[#1E3A5F] text-white"
                                            : "bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F4F6F8]"}`, children: "Clinician Mode" })] }), activeTab === "roadmap" && (_jsxs("button", { onClick: handleQuickDemoAutoFill, className: "bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm", children: [_jsx(Zap, { className: "w-4 h-4", strokeWidth: 1.75 }), "Auto-fill practice"] }))] }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: activeTab === "roadmap" ? (_jsxs("div", { children: [_jsx("div", { className: "mb-6", children: _jsx(GeneralizationGauge, { caseId: caseId, refreshTrigger: refreshKey }) }), learningPath.streak && (_jsx(motion.div, { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-white border border-[#CBD5E1] rounded-xl p-4 mb-6 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Flame, { className: "w-6 h-6 text-[#D97706]", strokeWidth: 1.75 }), _jsxs("div", { children: [_jsxs("div", { className: "font-bold text-lg text-[#0F172A] font-mono tabular-nums", children: ["Streak: ", learningPath.streak.current_streak_days, " days"] }), _jsx("div", { className: "text-sm text-[#475569]", children: "Practice today to maintain your streak" })] })] }) })), _jsx(Roadmap, { milestones: learningPath.milestones, onMilestoneClick: handleMilestoneClick, onUnlockMilestone: handleUnlockMilestone, progressData: progressData, refreshTrigger: refreshKey }), _jsx(BadgesShowcase, { caseId: caseId, refreshTrigger: refreshKey }), _jsx(AnimatePresence, { children: showCelebration && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#CCFBF1] border border-[#0D9488] rounded-xl p-4 mb-6 text-center shadow-sm", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-[#16A34A]", strokeWidth: 1.75 }), _jsx("span", { className: "font-bold text-lg text-[#0F172A]", children: "Badge unlocked" }), _jsx(CheckCircle2, { className: "w-5 h-5 text-[#16A34A]", strokeWidth: 1.75 })] }) })) }), _jsx(MilestoneCard, { milestone: selectedMilestone, onUnlockMilestone: handleUnlockMilestone, caseId: caseId, onProgressUpdate: handleProgressUpdate, onProbeComplete: handleProbeComplete, autoFillTrigger: autoFillTrigger })] })) : (_jsxs("div", { className: "relative", children: [_jsx(MilestoneEditor, { milestones: learningPath.milestones, onUpdateMilestone: handleUpdateMilestone, onAddMilestone: handleAddMilestone, onDeleteMilestone: handleDeleteMilestone, disabled: pathApproved }), !pathApproved && (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto flex justify-center", children: _jsxs("button", { onClick: handleApprovePath, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm", children: [_jsx(CheckCircle2, { className: "w-5 h-5", strokeWidth: 1.75 }), "Approve & Lock Path"] }) }) })), pathApproved && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "fixed bottom-0 left-0 right-0 bg-[#CCFBF1] border border-[#0D9488] text-[#0F172A] p-4 shadow-sm", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-center gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-[#16A34A]", strokeWidth: 1.75 }), _jsx("span", { className: "font-bold text-lg", children: "Path is live and approved" }), _jsx(CheckCircle2, { className: "w-6 h-6 text-[#16A34A]", strokeWidth: 1.75 })] }) }))] })) })] }));
}
