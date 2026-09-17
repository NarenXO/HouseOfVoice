import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Star } from "lucide-react";
import PracticePanel from "./PracticePanel";
export default function MilestoneCard({ milestone, onUnlockMilestone, caseId, onProgressUpdate, onProbeComplete, autoFillTrigger }) {
    if (!milestone) {
        return null;
    }
    const getStatusBadge = () => {
        switch (milestone.status) {
            case "locked":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600", children: "Locked" }));
            case "active":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white", children: "Active" }));
            case "trained":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white", children: "Trained" }));
            case "generalized":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900", children: "Generalized" }));
            default:
                return null;
        }
    };
    const getBanner = () => {
        if (milestone.status === "active") {
            return (_jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-sm font-medium text-blue-900", children: "Current Focus" })] }) }));
        }
        if (milestone.status === "generalized") {
            return (_jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "w-4 h-4 fill-amber-500 text-amber-500" }), _jsx("span", { className: "text-sm font-medium text-amber-900", children: "Generalized! \u2B50" })] }) }));
        }
        if (milestone.status === "locked") {
            return (_jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Complete previous milestone to unlock" })] }), _jsx("button", { onClick: () => onUnlockMilestone(milestone.id), className: "px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-medium transition-colors", children: "Unlock Anyway" })] }) }));
        }
        return null;
    };
    // Mock exercises for demo
    const mockExercises = milestone.exercises || [
        { id: "ex1", title: "Practice Set 1", instructions: "Repeat the target sound 10 times", done: milestone.status === "trained" || milestone.status === "generalized" },
        { id: "ex2", title: "Practice Set 2", instructions: "Use the sound in words", done: milestone.status === "generalized" },
        { id: "ex3", title: "Practice Set 3", instructions: "Use the sound in sentences", done: false },
    ];
    return (_jsx(AnimatePresence, { children: _jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.3 }, className: "w-full", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-1", children: milestone.title }), _jsx("p", { className: "text-gray-600 text-sm", children: milestone.goal })] }), getStatusBadge()] }), getBanner(), milestone.status === "active" ? (_jsx(PracticePanel, { milestone: milestone, caseId: caseId, onProgressUpdate: onProgressUpdate, onProbeComplete: onProbeComplete, autoFillTrigger: autoFillTrigger })) : (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-700 mb-2", children: "Exercises" }), mockExercises.map((exercise) => (_jsxs("div", { className: "flex items-start gap-3 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "pt-1", children: exercise.done ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-green-500" })) : (_jsx("div", { className: "w-5 h-5 border-2 border-gray-300 rounded-full" })) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: exercise.title }), _jsx("p", { className: "text-gray-600 text-xs mt-1", children: exercise.instructions })] })] }, exercise.id)))] }))] }) }) }));
}
