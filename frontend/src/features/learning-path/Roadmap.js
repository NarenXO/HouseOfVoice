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
        // Green if both are trained or generalized
        if ((current.status === "trained" || current.status === "generalized") &&
            (next.status === "trained" || next.status === "generalized")) {
            return "bg-[#16A34A]";
        }
        // Accent if going from active to locked
        if (current.status === "active" && next.status === "locked") {
            return "bg-[#CBD5E1]";
        }
        // Gray otherwise
        return "bg-[#CBD5E1]";
    };
    const getNodeStyles = (milestone) => {
        switch (milestone.status) {
            case "locked":
                return {
                    bg: "bg-[#F1F5F9]",
                    text: "text-[#0F172A]",
                    border: "border-[#CBD5E1]",
                    icon: _jsx(Lock, { className: "w-6 h-6", strokeWidth: 1.75 }),
                    animation: "",
                };
            case "active":
                return {
                    bg: "bg-[#1E3A5F]",
                    text: "text-white",
                    border: "border-[#0D9488]",
                    icon: _jsx(Target, { className: "w-6 h-6", strokeWidth: 1.75 }),
                    animation: "",
                };
            case "trained":
                return {
                    bg: "bg-[#16A34A]",
                    text: "text-white",
                    border: "border-[#16A34A]",
                    icon: _jsx(CheckCircle2, { className: "w-6 h-6", strokeWidth: 1.75 }),
                    animation: "",
                };
            case "generalized":
                return {
                    bg: "bg-[#0D9488]",
                    text: "text-white",
                    border: "border-[#0D9488]",
                    icon: _jsx(Award, { className: "w-6 h-6", strokeWidth: 1.75 }),
                    animation: "",
                };
            default:
                return {
                    bg: "bg-[#F1F5F9]",
                    text: "text-[#0F172A]",
                    border: "border-[#CBD5E1]",
                    icon: _jsx(Lock, { className: "w-6 h-6", strokeWidth: 1.75 }),
                    animation: "",
                };
        }
    };
    const MilestoneNode = ({ milestone, index }) => {
        const styles = getNodeStyles(milestone);
        const isGeneralized = milestone.status === "generalized";
        const isJustCompleted = justGeneralized.has(milestone.id);
        const isTrained = milestone.status === "trained";
        return (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx(motion.div, { initial: false, animate: {
                        opacity: isJustCompleted ? [0.8, 1] : 1,
                        scale: isJustCompleted ? [1, 1.0] : 1,
                    }, transition: { duration: 0.2, ease: "easeOut" }, className: "relative cursor-pointer", children: _jsxs("div", { className: `${styles.bg} ${styles.border} border-4 rounded-full w-20 h-20 flex items-center justify-center ${styles.text} shadow-sm hover:scale-105 transition-transform`, onClick: () => onMilestoneClick(milestone), onMouseEnter: () => setHoveredMilestone(milestone.id), onMouseLeave: () => setHoveredMilestone(null), children: [isGeneralized ? (_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, children: _jsx(Award, { className: "w-6 h-6", strokeWidth: 1.75 }) })) : isTrained ? (_jsx(CheckCircle2, { className: "w-6 h-6", strokeWidth: 1.75 })) : (styles.icon), milestone.status === "locked" && hoveredMilestone === milestone.id && (_jsx(motion.button, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.15, ease: "easeOut" }, className: "absolute -bottom-2 bg-white text-[#0F172A] px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:bg-[#F4F6F8] border border-[#CBD5E1]", onClick: (e) => {
                                    e.stopPropagation();
                                    onUnlockMilestone(milestone.id);
                                }, title: "Unlock milestone", children: "Unlock" }))] }) }), _jsx("div", { className: `text-sm font-semibold text-center max-w-[100px] ${styles.text}`, children: milestone.title }), milestone.status === "active" && progressData[milestone.id] && (_jsxs("div", { className: "bg-[#CCFBF1] text-[#0D9488] text-xs font-bold px-2 py-1 rounded-full", children: [progressData[milestone.id].consecutive_successes, "/3"] }))] }));
    };
    return (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "mb-4", children: _jsx("h3", { className: "text-xs font-semibold text-[#0D9488] tracking-wider uppercase", children: "Milestones" }) }), _jsx("div", { className: "hidden md:flex items-center justify-center gap-2 overflow-x-auto py-8", children: sortedMilestones.map((milestone, index) => {
                    const isLast = index === sortedMilestones.length - 1;
                    return (_jsxs("div", { className: "flex items-center", children: [index > 0 && (_jsx("div", { className: `w-16 h-1 ${getConnectorColor(index - 1, index)} rounded-full` })), _jsx(MilestoneNode, { milestone: milestone, index: index }), !isLast && (_jsx("div", { className: `w-16 h-1 ${getConnectorColor(index, index + 1)} rounded-full` }))] }, milestone.id));
                }) }), _jsx("div", { className: "md:hidden flex flex-col items-center gap-2 overflow-y-auto py-8", children: sortedMilestones.map((milestone, index) => {
                    const isLast = index === sortedMilestones.length - 1;
                    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(MilestoneNode, { milestone: milestone, index: index }), !isLast && (_jsx("div", { className: `w-1 h-12 ${getConnectorColor(index, index + 1)} rounded-full my-2` }))] }, milestone.id));
                }) })] }));
}
