import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import axios from "axios";
const API_BASE = "http://localhost:8000/api";
export default function GeneralizationGauge({ caseId, refreshTrigger = 0 }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchGeneralizationData();
    }, [caseId, refreshTrigger]);
    const fetchGeneralizationData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE}/learning/generalization/${caseId}`);
            setData(response.data);
        }
        catch (err) {
            console.error("Failed to fetch generalization data:", err);
            // Fallback to mock data
            try {
                const mockResponse = await fetch("/shared/mocks/generalization_score.mock.json");
                const mockData = await mockResponse.json();
                setData(mockData);
            }
            catch (mockErr) {
                setError("Failed to load generalization data");
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getGaugeColor = (rate) => {
        if (rate >= 0.8)
            return "#10b981"; // Emerald (High Generalization)
        if (rate >= 0.5)
            return "#f59e0b"; // Amber (Developing)
        return "#3b82f6"; // Blue (Early Training)
    };
    const getStatusText = (rate) => {
        if (rate >= 0.8)
            return "High Generalization";
        if (rate >= 0.5)
            return "Developing";
        return "Early Training";
    };
    const getTopPhoneme = () => {
        if (!data || data.phonemes.length === 0)
            return null;
        return data.phonemes.reduce((best, current) => current.rate > best.rate ? current : best);
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-48", children: _jsx("div", { className: "text-gray-500", children: "Loading generalization data..." }) }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-48", children: _jsx("div", { className: "text-red-500", children: error || "No data available" }) }) }));
    }
    const percentage = Math.round(data.overall_rate * 100);
    const gaugeColor = getGaugeColor(data.overall_rate);
    const statusText = getStatusText(data.overall_rate);
    const topPhoneme = getTopPhoneme();
    // Calculate SVG circle parameters
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.overall_rate * circumference);
    return (_jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "Clinical Generalization Index" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: "Untrained word mastery rate" })] }), _jsxs("div", { className: "relative group", children: [_jsx(Info, { className: "w-5 h-5 text-gray-400 cursor-help" }), _jsx("div", { className: "absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10", children: "Measures speech accuracy on words never practiced in therapy." })] })] }), _jsx("div", { className: "flex items-center justify-center mb-6", children: _jsxs("div", { className: "relative w-40 h-40", children: [_jsxs("svg", { className: "w-full h-full transform -rotate-90", viewBox: "0 0 120 120", children: [_jsx("circle", { cx: "60", cy: "60", r: radius, stroke: "#e5e7eb", strokeWidth: "10", fill: "none" }), _jsx(motion.circle, { cx: "60", cy: "60", r: radius, stroke: gaugeColor, strokeWidth: "10", fill: "none", strokeLinecap: "round", initial: { strokeDashoffset: circumference }, animate: { strokeDashoffset }, transition: { duration: 0.8, ease: "easeOut" }, style: {
                                        strokeDasharray: circumference,
                                    } })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "text-center", children: [_jsxs("div", { className: "text-4xl font-bold", style: { color: gaugeColor }, children: [percentage, "%"] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: statusText })] }, refreshTrigger) })] }) }), topPhoneme && topPhoneme.rate >= 0.8 && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-6", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\u2728" }), _jsxs("span", { className: "text-sm text-emerald-800 dark:text-emerald-300", children: [topPhoneme.phoneme, " is generalized! Ready for conversational transfer."] })] }) })), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Phoneme Breakdown" }), data.phonemes.map((phoneme) => {
                        const phonemePercentage = Math.round(phoneme.rate * 100);
                        const phonemeColor = getGaugeColor(phoneme.rate);
                        return (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm font-semibold text-gray-700 dark:text-gray-300", children: phoneme.phoneme }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${phonemePercentage}%` }, transition: { duration: 0.5 }, className: "h-full rounded-full", style: { backgroundColor: phonemeColor } }) }) }), _jsxs("div", { className: "text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap", children: [phoneme.probes_passed, " / ", phoneme.probes_attempted, " (", phonemePercentage, "%)"] })] }, phoneme.phoneme));
                    })] }), _jsxs("div", { className: "mt-6 pt-4 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Total Probes Attempted" }), _jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: data.total_probes_attempted })] }), _jsxs("div", { className: "flex justify-between text-sm mt-2", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Total Probes Passed" }), _jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: data.total_probes_passed })] })] })] }));
}
