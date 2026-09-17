import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, CheckCircle2, ArrowRight } from "lucide-react";
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
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "text-gray-500", children: "Loading checkpoint..." }) }));
    }
    return (_jsx("div", { className: "bg-white rounded-xl shadow-md p-6", children: _jsxs(AnimatePresence, { mode: "wait", children: [step === "challenge" && probeItem && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(Target, { className: "w-12 h-12 text-purple-600 mx-auto mb-4" }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Checkpoint Challenge" }), _jsx("p", { className: "text-gray-600", children: "Say this word out loud:" })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-6", children: [_jsx("div", { className: "text-5xl font-bold text-gray-900 mb-4", children: probeItem.display_text }), _jsx("p", { className: "text-gray-600 text-sm", children: probeItem.instructions })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: handleSubmitAttempt, disabled: loading, className: "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2", children: "\uD83C\uDFA4 I Said It!" }), _jsx("button", { onClick: onCancel, className: "bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors", children: "Cancel" })] })] }, "challenge")), step === "passed" && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx(motion.div, { initial: { scale: 0, rotate: -180 }, animate: { scale: 1, rotate: 0 }, transition: { type: "spring", delay: 0.2 }, className: "w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Star, { className: "w-12 h-12 text-white fill-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "\u2B50 Amazing Generalization!" }), _jsx("p", { className: "text-gray-600", children: "You mastered this sound on a brand new word!" })] }), outcomeData?.badge_awarded && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6", children: _jsxs("p", { className: "text-yellow-800 font-medium", children: ["Badge Awarded: ", outcomeData.badge_name] }) })), _jsxs("button", { onClick: handleComplete, className: "bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto", children: ["Continue Journey", _jsx(ArrowRight, { className: "w-5 h-5" })] })] }, "passed")), step === "continue" && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle2, { className: "w-10 h-10 text-blue-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCAA Great Effort!" }), _jsx("p", { className: "text-gray-600", children: outcomeData?.message || "Let's reinforce this sound with a few extra words." })] }), outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: [_jsx("p", { className: "text-blue-800 font-medium mb-3", children: "Extra Practice Words:" }), _jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: outcomeData.extra_practice_items.map((word, index) => (_jsx("span", { className: "bg-white border border-blue-300 text-blue-700 px-3 py-1 rounded-full text-sm font-medium", children: word }, index))) })] })), _jsx("button", { onClick: handleComplete, className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors", children: "Back to Practice" })] }, "continue"))] }) }));
}
