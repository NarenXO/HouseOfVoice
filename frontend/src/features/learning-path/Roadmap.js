import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Target, CheckCircle2, Award } from "lucide-react";
export default function Roadmap({ milestones, onMilestoneClick, onUnlockMilestone, progressData = {}, refreshTrigger = 0 }) {
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const [justGeneralized, setJustGeneralized] = useState(new Set());
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
    const getConnectorColor = (currentIndex, nextIndex) => {
        const current = sortedMilestones[currentIndex];
        const next = sortedMilestones[nextIndex];
        if ((current.status === "trained" || current.status === "generalized") &&
            (next.status === "trained" || next.status === "generalized")) {
            return "bg-[#059669]";
        }
        if (current.status === "active" || current.status === "trained" || current.status === "generalized") {
            return "bg-[#059669]";
        }
        return "bg-[#CBD5E1]";
    };
    const getNodeStyles = (milestone) => {
        switch (milestone.status) {
            case "locked":
                return {
                    bg: "bg-[#F8FAFC]",
                    text: "text-[#64748B]",
                    border: "border border-[#CBD5E1]",
                    icon: _jsx(Lock, { className: "w-6 h-6", strokeWidth: 1.75 }),
                };
            case "active":
                return {
                    bg: "bg-[#1E3A5F]",
                    text: "text-white",
                    border: "border-2 border-[#059669]",
                    icon: _jsx(Target, { className: "w-6 h-6 text-white", strokeWidth: 1.75 }),
                };
            case "trained":
                return {
                    bg: "bg-[#16A34A]",
                    text: "text-white",
                    border: "border border-[#16A34A]",
                    icon: _jsx(CheckCircle2, { className: "w-6 h-6 text-white", strokeWidth: 1.75 }),
                };
            case "generalized":
                return {
                    bg: "bg-[#059669]",
                    text: "text-white",
                    border: "border border-[#059669]",
                    icon: _jsx(Award, { className: "w-6 h-6 text-white", strokeWidth: 1.75 }),
                };
            default:
                return {
                    bg: "bg-[#F8FAFC]",
                    text: "text-[#64748B]",
                    border: "border border-[#CBD5E1]",
                    icon: _jsx(Lock, { className: "w-6 h-6", strokeWidth: 1.75 }),
                };
        }
    };
    const MilestoneNode = ({ milestone }) => {
        const styles = getNodeStyles(milestone);
        const isGeneralized = milestone.status === "generalized";
        const isJustCompleted = justGeneralized.has(milestone.id);
        const isTrained = milestone.status === "trained";
        return (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx(motion.div, { initial: false, animate: {
                        opacity: isJustCompleted ? [0.8, 1] : 1,
                        scale: isJustCompleted ? [1, 1.05, 1] : 1,
                    }, transition: { duration: 0.2, ease: "easeOut" }, className: "relative cursor-pointer", children: _jsxs("div", { className: `w-20 h-20 rounded-full flex items-center justify-center ${styles.bg} ${styles.border} ${styles.text} shadow-sm hover:scale-105 transition-transform`, onClick: () => onMilestoneClick(milestone), onMouseEnter: () => setHoveredMilestone(milestone.id), onMouseLeave: () => setHoveredMilestone(null), children: [isGeneralized ? (_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, children: _jsx(Award, { className: "w-6 h-6 text-white", strokeWidth: 1.75 }) })) : isTrained ? (_jsx(CheckCircle2, { className: "w-6 h-6 text-white", strokeWidth: 1.75 })) : (styles.icon), milestone.status === "locked" && hoveredMilestone === milestone.id && (_jsx(motion.button, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.15, ease: "easeOut" }, className: "absolute -bottom-2 bg-white text-[#022C22] px-3 py-1 rounded-full text-xs font-bold shadow-sm hover:bg-[#F0FDF4] border border-[#059669]", onClick: (e) => {
                                    e.stopPropagation();
                                    onUnlockMilestone(milestone.id);
                                }, title: "Unlock milestone", children: "Unlock" }))] }) }), _jsx("div", { className: "text-sm font-extrabold text-center max-w-[100px] text-[#022C22]", children: milestone.title }), milestone.status === "active" && progressData[milestone.id] && (_jsxs("div", { className: "bg-[#D1FAE5] text-[#047857] border border-[#059669] font-black px-3 py-1 rounded-full text-xs", children: [progressData[milestone.id].consecutive_successes, "/3"] }))] }));
    };
    return (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "mb-1.5", children: _jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-[#047857]", children: "MILESTONES" }) }), _jsxs("div", { className: "bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm", children: [_jsx("div", { className: "hidden md:flex items-center justify-center gap-2 overflow-x-auto py-6", children: sortedMilestones.map((milestone, index) => {
                            const isLast = index === sortedMilestones.length - 1;
                            return (_jsxs("div", { className: "flex items-center", children: [index > 0 && (_jsx("div", { className: `w-16 h-1 ${getConnectorColor(index - 1, index)} rounded-full` })), _jsx(MilestoneNode, { milestone: milestone, index: index }), !isLast && (_jsx("div", { className: `w-16 h-1 ${getConnectorColor(index, index + 1)} rounded-full` }))] }, milestone.id));
                        }) }), _jsx("div", { className: "md:hidden flex flex-col items-center gap-2 overflow-y-auto py-6", children: sortedMilestones.map((milestone, index) => {
                            const isLast = index === sortedMilestones.length - 1;
                            return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(MilestoneNode, { milestone: milestone, index: index }), !isLast && (_jsx("div", { className: `w-1 h-12 ${getConnectorColor(index, index + 1)} rounded-full my-2` }))] }, milestone.id));
                        }) })] })] }));
}
