import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Target, ArrowRight, X, RotateCcw, Mic } from "lucide-react";
import axios from "axios";
const API_BASE = "http://localhost:8000/api";
export default function ProbeSession({ milestoneId, caseId, phoneme, onComplete, onCancel, }) {
    const [step, setStep] = useState("loading");
    const [probeItem, setProbeItem] = useState(null);
    const [outcomeData, setOutcomeData] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // Fetch probe item on mount
        fetchProbeItem();
    }, [milestoneId, phoneme]);
    const fetchProbeItem = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE}/learning/milestones/${milestoneId}/checkpoint`, {
                case_id: caseId,
                phoneme: phoneme,
                audio_or_text: "",
            });
            if (response.data.phase === "probe_served") {
                setProbeItem(response.data.item);
                setStep("challenge");
            }
            else {
                // Not ready for checkpoint
                setOutcomeData(response.data);
                setStep("continue");
            }
        }
        catch (err) {
            console.error("Failed to fetch probe item:", err);
            setOutcomeData({ message: "Unable to load checkpoint. Please try again." });
            setStep("continue");
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmitAttempt = async () => {
        if (!probeItem)
            return;
        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE}/learning/milestones/${milestoneId}/checkpoint`, {
                case_id: caseId,
                phoneme: phoneme,
                audio_or_text: probeItem.display_text,
            });
            if (response.data.phase === "probe_scored") {
                setOutcomeData(response.data);
                if (response.data.result === "pass") {
                    setStep("passed");
                }
                else {
                    setStep("continue");
                }
            }
        }
        catch (err) {
            console.error("Failed to submit probe attempt:", err);
            setOutcomeData({ message: "Unable to submit attempt. Please try again." });
            setStep("continue");
        }
        finally {
            setLoading(false);
        }
    };
    const handleComplete = () => {
        if (outcomeData) {
            const status = outcomeData.milestone_status;
            const extraItems = outcomeData.extra_practice_items;
            onComplete(status, extraItems);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-white rounded-xl p-8 text-center", children: _jsx("div", { className: "text-[#475569] font-medium", children: "Loading checkpoint..." }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "bg-white border border-[#CBD5E1] rounded-[12px] shadow-sm max-w-lg w-full p-8 relative", children: [_jsx("button", { onClick: onCancel, className: "absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] transition-colors", children: _jsx(X, { className: "w-6 h-6", strokeWidth: 1.75 }) }), _jsxs(AnimatePresence, { mode: "wait", children: [step === "challenge" && probeItem && (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsx("div", { className: "mb-4", children: _jsx("h3", { className: "text-xs font-bold text-[#0D9488] tracking-wider uppercase", children: "Generalization probe" }) }), _jsxs("div", { className: "flex items-center justify-center gap-2 mb-6", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-sm font-bold", children: "1" }), _jsx("div", { className: "w-8 h-8 rounded-full bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center text-sm font-bold", children: "2" })] }), _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-[#CCFBF1] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Target, { className: "w-8 h-8 text-[#0D9488]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-2xl font-bold text-[#0F172A] mb-2", children: "Generalization probe" }), _jsx("p", { className: "text-[#475569] font-medium", children: "Say this word out loud:" })] }), _jsxs("div", { className: "bg-white border border-[#CBD5E1] rounded-xl p-8 mb-6", children: [_jsx("div", { className: "text-6xl font-bold text-[#0F172A] mb-4 font-mono tabular-nums", children: probeItem.display_text }), _jsx("p", { className: "text-[#475569] text-base font-medium", children: probeItem.instructions })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsxs("button", { onClick: handleSubmitAttempt, disabled: loading, className: "bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-semibold rounded-[8px] px-5 py-2.5 shadow-sm transition-colors flex items-center gap-2", children: [_jsx(Mic, { className: "w-5 h-5", strokeWidth: 1.75 }), "Submit"] }), _jsx("button", { onClick: onCancel, className: "bg-white hover:bg-[#F4F6F8] text-[#0F172A] border border-[#CBD5E1] font-semibold rounded-[8px] px-5 py-2.5 transition-colors", children: "Cancel" })] })] }, "challenge")), step === "passed" && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "w-24 h-24 bg-[#CCFBF1] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Award, { className: "w-14 h-14 text-[#0D9488]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-3xl font-bold text-[#0F172A] mb-2", children: "Probe complete" }), _jsx("p", { className: "text-[#475569] text-lg font-medium", children: "Sound generalized. You have mastered this sound on a new word." })] }), outcomeData?.badge_awarded && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#CCFBF1] border border-[#0D9488] rounded-xl p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx(Award, { className: "w-6 h-6 text-[#0D9488]", strokeWidth: 1.75 }), _jsx("p", { className: "text-[#0F172A] font-bold text-lg", children: outcomeData.badge?.title || "Sound Master Badge" }), _jsx(Award, { className: "w-6 h-6 text-[#0D9488]", strokeWidth: 1.75 })] }) })), _jsxs("button", { onClick: handleComplete, className: "bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded-[8px] px-5 py-2.5 shadow-sm transition-colors flex items-center gap-2 mx-auto", children: ["Continue", _jsx(ArrowRight, { className: "w-5 h-5", strokeWidth: 1.75 })] })] }, "passed")), step === "continue" && (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-[#F4F6F8] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(RotateCcw, { className: "w-12 h-12 text-[#D97706]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-2xl font-bold text-[#0F172A] mb-2", children: "Additional practice required" }), _jsx("p", { className: "text-[#64748B] font-medium", children: outcomeData?.message || "Let's reinforce this sound with additional practice." })] }), outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (_jsxs("div", { className: "bg-[#F4F6F8] border border-[#E2E8F0] rounded-xl p-6 mb-6", children: [_jsx("p", { className: "text-[#0F172A] font-bold mb-4", children: "Extra practice words:" }), _jsx("div", { className: "flex flex-wrap gap-3 justify-center", children: outcomeData.extra_practice_items.map((word, index) => (_jsx(motion.span, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: index * 0.05, duration: 0.15, ease: "easeOut" }, className: "bg-white border border-[#E2E8F0] text-[#0F172A] px-4 py-2 rounded-full text-sm font-medium shadow-sm", children: word }, index))) })] })), _jsx("button", { onClick: handleComplete, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white font-semibold rounded-[8px] px-5 py-2.5 shadow-sm transition-colors", children: "Back to practice" })] }, "continue"))] })] }) }));
}
