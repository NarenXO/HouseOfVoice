import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, CheckCircle2, ArrowRight, X } from "lucide-react";
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
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-white rounded-xl p-8 text-center", children: _jsx("div", { className: "text-gray-500", children: "Loading checkpoint..." }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative", children: [_jsx("button", { onClick: onCancel, className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-6 h-6" }) }), _jsxs(AnimatePresence, { mode: "wait", children: [step === "challenge" && probeItem && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(motion.div, { animate: { scale: [1, 1.1, 1] }, transition: { duration: 2, repeat: Infinity }, className: "w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Target, { className: "w-8 h-8 text-purple-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Checkpoint Challenge" }), _jsx("p", { className: "text-gray-600", children: "Say this word out loud:" })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-6 border-2 border-purple-200", children: [_jsx("div", { className: "text-6xl font-bold text-gray-900 mb-4", children: probeItem.display_text }), _jsx("p", { className: "text-gray-600 text-sm", children: probeItem.instructions })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: handleSubmitAttempt, disabled: loading, className: "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg", children: "\uD83C\uDFA4 I Said It!" }), _jsx("button", { onClick: onCancel, className: "bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-4 rounded-xl font-medium transition-colors", children: "Cancel" })] })] }, "challenge")), step === "passed" && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(motion.div, { initial: { scale: 0, rotate: -180 }, animate: { scale: 1, rotate: 0 }, transition: { type: "spring", delay: 0.2 }, className: "w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg", children: _jsx(Star, { className: "w-14 h-14 text-white fill-white" }) }), _jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83C\uDF89 New Badge Unlocked!" }), _jsx("p", { className: "text-gray-600 text-lg", children: "Generalization Star - You mastered this sound on a brand new word!" })] }), outcomeData?.badge_awarded && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("span", { className: "text-3xl", children: "\uD83C\uDFC6" }), _jsx("p", { className: "text-yellow-800 font-bold text-lg", children: outcomeData.badge?.title || "Sound Master Badge" }), _jsx("span", { className: "text-3xl", children: "\uD83C\uDFC6" })] }) })), _jsxs("button", { onClick: handleComplete, className: "bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto shadow-lg", children: ["Continue Journey", _jsx(ArrowRight, { className: "w-5 h-5" })] })] }, "passed")), step === "continue" && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle2, { className: "w-12 h-12 text-blue-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCAA Great Effort!" }), _jsx("p", { className: "text-gray-600", children: outcomeData?.message || "Let's reinforce this sound with a few extra words." })] }), outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (_jsxs("div", { className: "bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6", children: [_jsx("p", { className: "text-blue-800 font-bold mb-4", children: "Extra Practice Words:" }), _jsx("div", { className: "flex flex-wrap gap-3 justify-center", children: outcomeData.extra_practice_items.map((word, index) => (_jsx(motion.span, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: index * 0.1 }, className: "bg-white border-2 border-blue-300 text-blue-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm", children: word }, index))) })] })), _jsx("button", { onClick: handleComplete, className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg", children: "Back to Practice" })] }, "continue"))] })] }) }));
}
