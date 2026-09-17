import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Target, CheckCircle2, ArrowRight, X, RotateCcw, Mic } from "lucide-react";
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
        return (_jsx("div", { className: "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50", children: _jsx("div", { className: "bg-white border border-[#A7E3D5] rounded-[14px] p-8 text-center shadow-md", children: _jsx("div", { className: "text-[#334155] font-semibold", children: "Loading checkpoint..." }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-white border-2 border-[#059669] rounded-[16px] shadow-md max-w-lg w-full p-6 relative", children: [_jsx("button", { onClick: onCancel, className: "absolute top-4 right-4 text-[#1E293B] hover:text-[#022C22] transition-colors", children: _jsx(X, { className: "w-6 h-6", strokeWidth: 1.75 }) }), _jsxs(AnimatePresence, { mode: "wait", children: [step === "challenge" && probeItem && (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsx("div", { className: "mb-1.5", children: _jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-[#047857]", children: "GENERALIZATION PROBE" }) }), _jsxs("div", { className: "flex items-center justify-center gap-2 mb-6", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center text-sm font-black", children: "1" }), _jsx("div", { className: "w-8 h-8 rounded-full bg-[#D1FAE5] text-[#047857] flex items-center justify-center text-sm font-black", children: "2" })] }), _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-[#D1FAE5] border border-[#059669] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Target, { className: "w-8 h-8 text-[#059669]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-2xl font-black text-[#022C22] tracking-tight mb-2", children: "Generalization probe" }), _jsx("p", { className: "text-[#1E293B] font-bold", children: "Say this word out loud:" })] }), _jsxs("div", { className: "bg-[#F0FDF4] border border-[#A7F3D0] rounded-[12px] p-8 mb-6", children: [_jsx("div", { className: "text-4xl font-black text-[#022C22] tracking-tight mb-3", children: probeItem.display_text }), _jsx("p", { className: "text-base font-extrabold text-[#022C22]", children: probeItem.instructions })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsxs("button", { onClick: handleSubmitAttempt, disabled: loading, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-extrabold rounded-lg px-4 py-2 transition-colors flex items-center gap-2 shadow-sm", children: [_jsx(Mic, { className: "w-5 h-5", strokeWidth: 1.75 }), "Submit"] }), _jsx("button", { onClick: onCancel, className: "bg-white hover:bg-[#F0FDF4] text-[#022C22] border border-[#059669] font-extrabold rounded-lg px-4 py-2 transition-colors", children: "Cancel" })] })] }, "challenge")), step === "passed" && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "w-20 h-20 bg-[#D1FAE5] border border-[#059669] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Award, { className: "w-10 h-10 text-[#059669]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-2xl font-black text-[#022C22] tracking-tight mb-2", children: "Probe complete" }), _jsx("p", { className: "text-[#1E293B] text-base font-bold", children: "Sound generalized. You have mastered this sound on a new word." })] }), outcomeData?.badge_awarded && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#F0FDF4] border border-[#A7F3D0] text-[#022C22] rounded-[12px] p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-[#059669]", strokeWidth: 1.75 }), _jsx("p", { className: "text-[#022C22] font-black text-lg", children: outcomeData.badge?.title || "Sound Master Badge" }), _jsx(CheckCircle2, { className: "w-6 h-6 text-[#059669]", strokeWidth: 1.75 })] }) })), _jsxs("button", { onClick: handleComplete, className: "bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-lg px-4 py-2 transition-colors flex items-center gap-2 mx-auto shadow-sm", children: ["Continue", _jsx(ArrowRight, { className: "w-5 h-5 text-white", strokeWidth: 1.75 })] })] }, "passed")), step === "continue" && (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-[#FEF3C7] border border-[#FDE68A] rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(RotateCcw, { className: "w-10 h-10 text-[#D97706]", strokeWidth: 1.75 }) }), _jsx("h3", { className: "text-2xl font-black text-[#022C22] tracking-tight mb-2", children: "Additional practice required" }), _jsx("p", { className: "text-[#1E293B] font-bold", children: outcomeData?.message || "Let's reinforce this sound with additional practice." })] }), outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (_jsxs("div", { className: "bg-[#FFFBEB] border border-[#D97706] text-[#022C22] rounded-[12px] p-6 mb-6", children: [_jsx("p", { className: "text-[#022C22] font-black mb-4", children: "Extra practice words:" }), _jsx("div", { className: "flex flex-wrap gap-3 justify-center", children: outcomeData.extra_practice_items.map((word, index) => (_jsx(motion.span, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: index * 0.05, duration: 0.15, ease: "easeOut" }, className: "bg-white border border-[#059669] text-[#022C22] px-4 py-2 rounded-full text-sm font-black shadow-sm", children: word }, index))) })] })), _jsx("button", { onClick: handleComplete, className: "bg-[#1E3A5F] hover:bg-[#2E5A88] text-white font-extrabold rounded-lg px-4 py-2 transition-colors shadow-sm", children: "Back to practice" })] }, "continue"))] })] }) }));
}
