import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Target } from "lucide-react";
import axios from "axios";
import ProbeSession from "./ProbeSession";
const API_BASE = "http://localhost:8000/api";
export default function PracticePanel({ milestone, caseId, onCheckpointReady, onProgressUpdate, onProbeComplete }) {
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
        try {
            const response = await axios.post(`${API_BASE}/learning/milestones/${milestone.id}/practice-attempt`, {
                case_id: caseId,
                exercise_index: exerciseIndex,
                audio_or_text: "",
            });
            // Update exercise completion
            const updatedExercises = exercises.map((ex, index) => index === exerciseIndex ? { ...ex, done: true } : ex);
            setExercises(updatedExercises);
            // Update progress
            setProgress(response.data);
            setStreak(response.data.streak);
            // Notify parent of progress update
            if (onProgressUpdate) {
                onProgressUpdate(milestone.id, response.data.consecutive_successes, response.data.checkpoint_ready);
            }
            // Show notification
            const consecutiveCount = response.data.consecutive_successes;
            const threshold = 3;
            const remaining = threshold - consecutiveCount;
            if (remaining > 0) {
                setNotification(`Great job! ${remaining} more practice session${remaining > 1 ? 's' : ''} to checkpoint`);
            }
            else {
                setNotification("🎯 Checkpoint ready! You've mastered the exercises!");
            }
            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
            // Check if checkpoint is ready
            if (response.data.checkpoint_ready && onCheckpointReady) {
                onCheckpointReady();
            }
        }
        catch (err) {
            console.error("Failed to record practice attempt:", err);
            // Fallback: update local state for demo
            const updatedExercises = exercises.map((ex, index) => index === exerciseIndex ? { ...ex, done: true } : ex);
            setExercises(updatedExercises);
            const completedCount = updatedExercises.filter((ex) => ex.done).length;
            setProgress({
                total_exercises: 3,
                completed_exercises: completedCount,
                consecutive_successes: completedCount,
                checkpoint_ready: completedCount >= 3,
                recent_attempts: [],
            });
            // Notify parent of progress update
            if (onProgressUpdate) {
                onProgressUpdate(milestone.id, completedCount, completedCount >= 3);
            }
            setNotification("Great job! Practice recorded (demo mode)");
            setTimeout(() => setNotification(null), 3000);
        }
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
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-md p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-1", children: milestone.title }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: milestone.goal }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: ["Practice ", progress.consecutive_successes, " of ", threshold, " days to unlock checkpoint"] }), _jsxs("span", { className: "text-sm font-bold text-blue-600", children: [progress.completed_exercises, "/", progress.total_exercises] })] }), _jsx("div", { className: "w-full bg-gray-200 h-3 rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${progressPercentage}%` }, transition: { duration: 0.5 }, className: "bg-blue-500 h-full rounded-full" }) })] }), _jsx(AnimatePresence, { children: notification && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "bg-green-50 border border-green-200 rounded-lg p-3 mb-4", children: _jsx("p", { className: "text-sm font-medium text-green-800", children: notification }) })) }), progress.checkpoint_ready && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Target, { className: "w-5 h-5 text-purple-600 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-purple-800 mb-1", children: "\uD83C\uDFAF Checkpoint Ready!" }), _jsx("p", { className: "text-sm text-purple-700 mb-3", children: "You've mastered the trained words. Your therapist will test you on a new word next session." }), _jsx("button", { onClick: handleTakeCheckpoint, className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors", children: "Take Checkpoint" })] })] }) })), _jsx("div", { className: "space-y-3 mb-6", children: exercises.map((exercise, index) => (_jsx("div", { className: `p-4 rounded-lg border transition-all ${exercise.done
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h4", { className: `font-medium mb-1 ${exercise.done ? "text-green-800 line-through opacity-60" : "text-gray-900"}`, children: ["Exercise ", index + 1, ": ", exercise.title] }), _jsx("p", { className: `text-sm ${exercise.done ? "text-green-700 opacity-60" : "text-gray-600"}`, children: exercise.instructions })] }), _jsx("div", { className: "ml-4", children: exercise.done ? (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "flex items-center justify-center w-8 h-8 bg-green-500 rounded-full", children: _jsx(CheckCircle2, { className: "w-5 h-5 text-white" }) })) : (_jsx("button", { onClick: () => handleMarkDone(index), className: "bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", children: "Mark Done" })) })] }) }, exercise.id))) }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flame, { className: "w-5 h-5 text-orange-500" }), _jsxs("span", { className: "text-orange-500 font-bold", children: ["Streak: ", streak?.current_streak_days || 0, " days"] })] }), _jsx("button", { onClick: () => {
                            alert("Practice session recorded! Great job keeping up your streak!");
                        }, className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors", children: "Record Practice Session" })] })] }));
}
