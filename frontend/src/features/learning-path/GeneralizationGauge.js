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
            return "#0D9488"; // Teals for high generalization
        if (rate >= 0.5)
            return "#0D9488";
        return "#0D9488";
    };
    const getStatusText = (rate) => {
        if (rate >= 0.8)
            return "High generalization";
        if (rate >= 0.5)
            return "Developing";
        return "Early training";
    };
    const getTopPhoneme = () => {
        if (!data || data.phonemes.length === 0)
            return null;
        return data.phonemes.reduce((best, current) => current.rate > best.rate ? current : best);
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-48", children: _jsx("div", { className: "text-[#1E293B] font-bold", children: "Loading generalization data..." }) }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-48", children: _jsx("div", { className: "text-[#DC2626] font-extrabold", children: error || "No data available" }) }) }));
    }
    const percentage = Math.round(data.overall_rate * 100);
    const statusText = getStatusText(data.overall_rate);
    const topPhoneme = getTopPhoneme();
    // Calculate SVG circle parameters
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.overall_rate * circumference);
    return (_jsxs("div", { className: "bg-[#064E3B] border-2 border-[#0D9488] rounded-[16px] p-6 shadow-md", children: [_jsx("div", { className: "mb-1.5", children: _jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-[#A7F3D0]", children: "GENERALIZATION BY CONTEXT" }) }), _jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-black text-white tracking-tight", children: "Generalization index" }), _jsx("p", { className: "text-sm font-bold text-[#D1FAE5] mt-1", children: "Untrained word mastery rate" })] }), _jsxs("div", { className: "relative group", children: [_jsx(Info, { className: "w-5 h-5 text-[#D1FAE5] cursor-help", strokeWidth: 1.75 }), _jsx("div", { className: "absolute right-0 top-6 w-64 p-3 bg-[#022C22] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-bold", children: "Measures speech accuracy on words never practiced in therapy." })] })] }), _jsx("div", { className: "flex items-center justify-center mb-6", children: _jsxs("div", { className: "relative w-44 h-44", children: [_jsxs("svg", { className: "w-full h-full transform -rotate-90", viewBox: "0 0 120 120", children: [_jsx("circle", { cx: "60", cy: "60", r: radius, stroke: "#047857", strokeWidth: "10", fill: "none" }), _jsx(motion.circle, { cx: "60", cy: "60", r: radius, stroke: "#34D399", strokeWidth: "10", fill: "none", strokeLinecap: "round", initial: { strokeDashoffset: circumference }, animate: { strokeDashoffset }, transition: { duration: 0.2, ease: "easeOut" }, style: {
                                        strokeDasharray: circumference,
                                    } })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "text-center", children: [_jsxs("div", { className: "text-5xl font-black text-white tabular-nums tracking-tight", children: [percentage, "%"] }), _jsx("div", { className: "text-xs font-extrabold text-[#34D399] mt-1", children: statusText })] }, refreshTrigger) })] }) }), topPhoneme && topPhoneme.rate >= 0.8 && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#022C22] border border-[#059669] rounded-[12px] p-4 mb-6 shadow-sm", children: _jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "text-sm font-extrabold text-[#34D399]", children: [topPhoneme.phoneme, " is generalized. Ready for conversational transfer."] }) }) })), _jsx("div", { className: "space-y-3", children: data.phonemes.map((phoneme) => {
                    const phonemePercentage = Math.round(phoneme.rate * 100);
                    return (_jsxs(motion.div, { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: "bg-[#022C22] text-white border border-[#059669] rounded-[12px] p-3 flex items-center gap-3 shadow-sm", children: [_jsx("div", { className: "w-12 h-8 flex items-center justify-center bg-[#064E3B] text-[#34D399] border border-[#059669] font-black rounded-md text-xs font-mono", children: phoneme.phoneme }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "h-3 bg-[#047857] rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${phonemePercentage}%` }, transition: { duration: 0.2, ease: "easeOut" }, className: "h-full bg-[#34D399] rounded-full" }) }) }), _jsxs("div", { className: "text-sm text-white whitespace-nowrap tabular-nums font-extrabold", children: [phoneme.probes_passed, " / ", phoneme.probes_attempted, " (", phonemePercentage, "%)"] })] }, phoneme.phoneme));
                }) }), _jsxs("div", { className: "bg-[#022C22] border border-[#059669] rounded-[12px] p-4 mt-6 shadow-sm", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "font-extrabold text-white text-sm", children: "Total probes attempted" }), _jsx("span", { className: "font-black text-[#CCFBF1] text-lg tabular-nums", children: data.total_probes_attempted })] }), _jsxs("div", { className: "flex justify-between items-center text-sm mt-2", children: [_jsx("span", { className: "font-extrabold text-white text-sm", children: "Total probes passed" }), _jsx("span", { className: "font-black text-[#CCFBF1] text-lg tabular-nums", children: data.total_probes_passed })] })] })] }));
}
