import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Award } from "lucide-react";
import PracticePanel from "./PracticePanel";
export default function MilestoneCard({ milestone, onUnlockMilestone, caseId, onProgressUpdate, onProbeComplete, autoFillTrigger }) {
    if (!milestone) {
        return null;
    }
    const getStatusBadge = () => {
        switch (milestone.status) {
            case "locked":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-bold bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1]", children: "Locked" }));
            case "active":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-black bg-[#1E3A5F] text-white", children: "Active" }));
            case "trained":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-black bg-[#16A34A] text-white", children: "Trained" }));
            case "generalized":
                return (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-black bg-[#059669] text-white", children: "Generalized" }));
            default:
                return null;
        }
    };
    const getBanner = () => {
        if (milestone.status === "active") {
            return (_jsx("div", { className: "bg-[#F0FDF4] border border-[#A7F3D0] rounded-[12px] p-3 mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2.5 h-2.5 bg-[#059669] rounded-full" }), _jsx("span", { className: "text-sm font-extrabold text-[#022C22]", children: "Current focus" })] }) }));
        }
        if (milestone.status === "generalized") {
            return (_jsx("div", { className: "bg-[#F0FDF4] border border-[#A7F3D0] rounded-[12px] p-3 mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Award, { className: "w-4 h-4 text-[#059669]", strokeWidth: 1.75 }), _jsx("span", { className: "text-sm font-extrabold text-[#022C22]", children: "Generalized" })] }) }));
        }
        if (milestone.status === "locked") {
            return (_jsx("div", { className: "bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] p-3 mb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "w-4 h-4 text-[#64748B]", strokeWidth: 1.75 }), _jsx("span", { className: "text-sm font-bold text-[#1E293B]", children: "Complete previous milestone to unlock" })] }), _jsx("button", { onClick: () => onUnlockMilestone(milestone.id), className: "px-3 py-1 bg-white hover:bg-[#F0FDF4] text-[#022C22] border border-[#059669] rounded-full text-xs font-bold transition-colors", children: "Unlock" })] }) }));
        }
        return null;
    };
    // Mock exercises for demo
    const mockExercises = milestone.exercises || [
        { id: "ex1", title: "Practice Set 1", instructions: "Repeat the target sound 10 times", done: milestone.status === "trained" || milestone.status === "generalized" },
        { id: "ex2", title: "Practice Set 2", instructions: "Use the sound in words", done: milestone.status === "generalized" },
        { id: "ex3", title: "Practice Set 3", instructions: "Use the sound in sentences", done: false },
    ];
    return (_jsx(AnimatePresence, { children: _jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "w-full", children: _jsxs("div", { className: "bg-white border-2 border-[#059669] rounded-[16px] shadow-sm p-6 mt-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-black text-[#022C22] tracking-tight mb-1", children: milestone.title }), _jsx("p", { className: "text-sm font-bold text-[#1E293B]", children: milestone.goal })] }), getStatusBadge()] }), getBanner(), milestone.status === "active" ? (_jsx(PracticePanel, { milestone: milestone, caseId: caseId, onProgressUpdate: onProgressUpdate, onProbeComplete: onProbeComplete, autoFillTrigger: autoFillTrigger })) : (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-xs font-black uppercase tracking-widest text-[#047857] mb-2", children: "EXERCISES" }), mockExercises.map((exercise) => (_jsxs("div", { className: "flex items-start gap-3 p-4 bg-[#F0FDF4] border border-[#A7F3D0] rounded-[12px]", children: [_jsx("div", { className: "pt-1", children: exercise.done ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-[#059669]", strokeWidth: 1.75 })) : (_jsx("div", { className: "w-5 h-5 border-2 border-[#CBD5E1] rounded-full" })) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-black text-[#022C22] text-base", children: exercise.title }), _jsx("p", { className: "text-base font-extrabold text-[#022C22] mt-1", children: exercise.instructions })] })] }, exercise.id)))] }))] }) }) }));
}
