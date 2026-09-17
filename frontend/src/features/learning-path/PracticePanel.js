import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Target } from "lucide-react";
import axios from "axios";
import ProbeSession from "./ProbeSession";
const API_BASE = "http://localhost:8000/api";
export default function PracticePanel({ milestone, caseId, onCheckpointReady, onProgressUpdate, onProbeComplete, autoFillTrigger }) {
    const [progress, setProgress] = useState(null);
    const [streak, setStreak] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [showProbeSession, setShowProbeSession] = useState(false);
    // Mock exercises for the milestone
    const mockExercises = [
        { id: "ex1", title: "Say 'sun' five times slowly", instructions: "Repeat the word 'sun' slowly, focusing on the /s/ sound", done: false },
        { id: "ex2", title: "Practice 'sock' in a sentence", instructions: "Use the word 'sock' in a sentence like 'I put on my sock'", done: false },
        { id: "ex3", title: "Read the 's' word list", instructions: "Read the list of words: sun, soap, soup, sand, sock", done: false },
    ];
    useEffect(() => {
        // Initialize exercises
        setExercises(mockExercises);
        fetchProgress();
    }, [milestone.id]);
    // Handle auto-fill trigger from parent
    useEffect(() => {
        if (autoFillTrigger && autoFillTrigger > 0) {
            handleAutoFill();
        }
    }, [autoFillTrigger]);
    const handleAutoFill = () => {
        // IMMEDIATE local state updates (synchronous)
        const updatedExercises = mockExercises.map((ex) => ({ ...ex, done: true }));
        setExercises(updatedExercises);
        setProgress({
            total_exercises: 3,
            completed_exercises: 3,
            consecutive_successes: 3,
            checkpoint_ready: true,
            recent_attempts: [],
        });
        // Notify parent immediately
        if (onProgressUpdate) {
            onProgressUpdate(milestone.id, 3, true);
        }
        setNotification("Practice session completed");
        setTimeout(() => setNotification(null), 3000);
    };
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
        }
        catch (err) {
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
        }
        finally {
            setLoading(false);
        }
    };
    const handleMarkDone = async (exerciseIndex) => {
        // IMMEDIATE local state updates (happen synchronously)
        const updatedExercises = exercises.map((ex, index) => index === exerciseIndex ? { ...ex, done: true } : ex);
        setExercises(updatedExercises);
        const completedCount = updatedExercises.filter((ex) => ex.done).length;
        const checkpointReady = completedCount >= 3;
        // Update progress immediately
        setProgress({
            total_exercises: 3,
            completed_exercises: completedCount,
            consecutive_successes: completedCount,
            checkpoint_ready: checkpointReady,
            recent_attempts: [],
        });
        // Notify parent immediately
        if (onProgressUpdate) {
            onProgressUpdate(milestone.id, completedCount, checkpointReady);
        }
        // Show notification immediately
        const threshold = 3;
        const remaining = threshold - completedCount;
        if (remaining > 0) {
            setNotification(`${remaining} more practice session${remaining > 1 ? 's' : ''} to checkpoint`);
        }
        else {
            setNotification("Checkpoint ready");
        }
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
        // Check if checkpoint is ready immediately
        if (checkpointReady && onCheckpointReady) {
            onCheckpointReady();
        }
        // Try API call but don't wait for it - fire and forget
        axios.post(`${API_BASE}/learning/milestones/${milestone.id}/practice-attempt`, {
            case_id: caseId,
            exercise_index: exerciseIndex,
            audio_or_text: "",
        }).then(response => {
            // Update with server response if successful
            setProgress(response.data);
            setStreak(response.data.streak);
            if (onProgressUpdate) {
                onProgressUpdate(milestone.id, response.data.consecutive_successes, response.data.checkpoint_ready);
            }
        }).catch(err => {
            console.log("Practice attempt API call failed (non-critical):", err);
        });
    };
    const handleTakeCheckpoint = () => {
        setShowProbeSession(true);
    };
    const handleProbeComplete = (status, extraItems) => {
        setShowProbeSession(false);
        // Trigger gauge refresh
        if (onProbeComplete) {
            onProbeComplete();
        }
        if (status === "generalized") {
            // Refresh roadmap and milestone cards
            if (onProgressUpdate) {
                onProgressUpdate(milestone.id, 3, false); // Reset checkpoint ready
            }
            // Trigger parent refresh if available
            window.location.reload(); // Simple refresh for demo
        }
        else if (status === "trained" && extraItems) {
            // Append extra practice items to exercise list and reset progress
            const extraExercises = extraItems.map((word, index) => ({
                id: `extra_${index}`,
                title: `Practice "${word}"`,
                instructions: `Say "${word}" clearly out loud to reinforce the sound`,
                done: false,
            }));
            setExercises([...exercises, ...extraExercises]);
            // Reset progress by fetching fresh data
            setTimeout(() => fetchProgress(), 100);
            if (onProgressUpdate) {
                onProgressUpdate(milestone.id, 0, false);
            }
        }
    };
    const handleProbeCancel = () => {
        setShowProbeSession(false);
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "text-gray-500", children: "Loading practice panel..." }) }));
    }
    if (!progress) {
        return null;
    }
    // Show probe session if active
    if (showProbeSession) {
        // Extract phoneme from milestone title (e.g., "s - start of words" -> "/s/")
        const phonemeMatch = milestone.title.match(/^([a-z]+)/);
        const phoneme = phonemeMatch ? `/${phonemeMatch[1]}/` : "/s/";
        return (_jsx(ProbeSession, { milestoneId: milestone.id, caseId: caseId, phoneme: phoneme, onComplete: handleProbeComplete, onCancel: handleProbeCancel }));
    }
    const progressPercentage = (progress.completed_exercises / progress.total_exercises) * 100;
    const threshold = 3;
    const remaining = threshold - progress.consecutive_successes;
    return (_jsxs("div", { className: "bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-xl font-bold text-[#0F172A] mb-1", children: milestone.title }), _jsx("p", { className: "text-[#64748B] text-sm mb-4", children: milestone.goal }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-[#64748B]", children: ["Practice ", progress.consecutive_successes, " of ", threshold, " days to unlock checkpoint"] }), _jsxs("span", { className: "text-sm font-bold text-[#0D9488] font-mono tabular-nums", children: [progress.completed_exercises, "/", progress.total_exercises] })] }), _jsx("div", { className: "w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${progressPercentage}%` }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#0D9488] h-full rounded-full" }) })] }), _jsx(AnimatePresence, { children: notification && (_jsx(motion.div, { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm font-medium text-[#0F172A]", children: notification }) })) }), progress.checkpoint_ready && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#CCFBF1] border border-[#0D9488] rounded-xl p-6 mb-6 shadow-sm", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx(Target, { className: "w-8 h-8 text-[#0D9488] flex-shrink-0", strokeWidth: 1.75 }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-bold text-[#0F172A] text-lg mb-2", children: "Checkpoint ready" }), _jsx("p", { className: "text-[#64748B] mb-4", children: "You have completed the required practice sessions. Take the generalization probe to assess progress." }), _jsxs("button", { onClick: handleTakeCheckpoint, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm", children: [_jsx(Target, { className: "w-5 h-5", strokeWidth: 1.75 }), "Take probe checkpoint"] })] })] }) })), _jsx("div", { className: "space-y-4 mb-6", children: exercises.map((exercise, index) => (_jsx("div", { className: `p-5 rounded-xl border-2 transition-all ${exercise.done
                        ? "bg-[#CCFBF1] border-[#0D9488]"
                        : "bg-white border-[#E2E8F0] hover:border-[#0D9488] hover:shadow-sm"}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h4", { className: `font-bold mb-2 ${exercise.done ? "text-[#0D9488] line-through opacity-60" : "text-[#0F172A]"}`, children: ["Exercise ", index + 1, ": ", exercise.title] }), _jsx("p", { className: `text-sm ${exercise.done ? "text-[#0D9488] opacity-60" : "text-[#64748B]"}`, children: exercise.instructions })] }), _jsx("div", { className: "ml-4", children: exercise.done ? (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "flex items-center justify-center w-10 h-10 bg-[#16A34A] rounded-full", children: _jsx(CheckCircle2, { className: "w-6 h-6 text-white", strokeWidth: 1.75 }) })) : (_jsx("button", { onClick: () => handleMarkDone(index), className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm", children: "Mark Done" })) })] }) }, exercise.id))) }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-[#E2E8F0]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flame, { className: "w-5 h-5 text-[#D97706]", strokeWidth: 1.75 }), _jsxs("span", { className: "text-[#D97706] font-bold font-mono tabular-nums", children: ["Streak: ", streak?.current_streak_days || 0, " days"] })] }), _jsx("button", { onClick: () => {
                            alert("Practice session recorded");
                        }, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white px-6 py-3 rounded-lg font-medium transition-colors", children: "Record Practice Session" })] })] }));
}
