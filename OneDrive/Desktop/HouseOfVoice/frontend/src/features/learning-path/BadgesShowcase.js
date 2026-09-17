import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ShieldCheck, Medal, Lock } from "lucide-react";
import axios from "axios";
const API_BASE = "http://localhost:8000/api";
const ICON_MAP = {
    award: Award,
    shield: ShieldCheck,
    medal: Medal,
};
export default function BadgesShowcase({ caseId, refreshTrigger = 0 }) {
    const [badgesData, setBadgesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newBadgeAnimation, setNewBadgeAnimation] = useState(null);
    useEffect(() => {
        fetchBadges();
    }, [caseId, refreshTrigger]);
    const fetchBadges = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE}/learning/badges/${caseId}`);
            // Check if a new badge was added
            if (badgesData && response.data.total_badges > badgesData.total_badges) {
                const newBadge = response.data.badges[response.data.badges.length - 1];
                setNewBadgeAnimation(newBadge.id);
                setTimeout(() => setNewBadgeAnimation(null), 3000);
            }
            setBadgesData(response.data);
        }
        catch (err) {
            console.error("Failed to fetch badges:", err);
            // Fallback to mock data
            try {
                const mockResponse = await fetch("/shared/mocks/badges.mock.json");
                const mockData = await mockResponse.json();
                setBadgesData(mockData);
            }
            catch (mockErr) {
                setError("Failed to load badges");
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getIconComponent = (iconName) => {
        const IconComponent = ICON_MAP[iconName] || Award;
        return _jsx(IconComponent, { className: "w-8 h-8", strokeWidth: 1.75 });
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white border border-[#A7E3D5] rounded-[14px] p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "text-[#475569] font-medium", children: "Loading achievements..." }) }) }));
    }
    if (error || !badgesData) {
        return (_jsx("div", { className: "bg-white border border-[#A7E3D5] rounded-[14px] p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "text-[#DC2626] font-semibold", children: error || "No data available" }) }) }));
    }
    const unlockedBadges = badgesData.badges;
    const totalBadges = unlockedBadges.length;
    // Mock upcoming badges for display
    const upcomingBadges = [
        { phoneme: "/r/", title: "Master /r/ to unlock" },
        { phoneme: "/th/", title: "Master /th/ to unlock" },
    ];
    return (_jsxs("div", { className: "bg-[#064E3B] border-2 border-[#0D9488] rounded-[16px] p-6 shadow-md", children: [_jsx("div", { className: "mb-1.5", children: _jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-[#A7F3D0]", children: "ACHIEVEMENTS" }) }), _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-black text-white tracking-tight flex items-center gap-2", children: [_jsx(Award, { className: "w-6 h-6 text-[#34D399]", strokeWidth: 1.75 }), "Achievements"] }), _jsx("p", { className: "text-sm font-bold text-[#D1FAE5] mt-1", children: "Earned by mastering sounds in new words" })] }), _jsxs("div", { className: "bg-[#022C22] text-[#34D399] border border-[#059669] font-black px-3 py-1 rounded-full text-xs", children: [totalBadges, " ", totalBadges === 1 ? "Badge" : "Badges"] })] }), totalBadges === 0 && (_jsxs("div", { className: "text-center py-8", children: [_jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "inline-block p-4 bg-[#022C22] rounded-full mb-4 border border-[#059669]", children: _jsx(Lock, { className: "w-8 h-8 text-[#059669]", strokeWidth: 1.75 }) }), _jsx("p", { className: "text-white text-base font-extrabold", children: "Complete your first checkpoint probe to unlock your first badge" })] })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [unlockedBadges.map((badge, index) => {
                        const isNew = badge.id === newBadgeAnimation;
                        const IconComponent = ICON_MAP[badge.icon] || Award;
                        return (_jsx(motion.div, { initial: { opacity: 0, y: 8, scale: 0.95 }, animate: {
                                opacity: 1,
                                y: 0,
                                scale: isNew ? [1, 1.02, 1] : 1
                            }, transition: { delay: index * 0.05, duration: 0.2, ease: "easeOut" }, whileHover: { scale: 1.02, y: -2 }, className: "relative bg-[#022C22] border border-[#059669] rounded-[12px] p-4 shadow-sm", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "p-3 bg-[#064E3B] rounded-full border border-[#059669]", children: _jsx(IconComponent, { className: "w-8 h-8 text-[#34D399]", strokeWidth: 1.75 }) }) }), _jsx("h3", { className: "font-black text-white text-base mb-1 text-center", children: badge.title }), _jsx("div", { className: "flex items-center justify-center gap-2 mb-2", children: _jsx("span", { className: "bg-[#064E3B] text-[#34D399] border border-[#059669] font-black px-3 py-1 rounded-full text-xs", children: badge.phoneme }) }), _jsx("p", { className: "text-sm text-[#D1FAE5] font-bold text-center", children: badge.description }), isNew && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { duration: 0.2, ease: "easeOut" }, className: "absolute -top-2 -right-2 bg-white text-[#064E3B] text-xs px-2 py-0.5 rounded-full font-black shadow-sm", children: "New" }))] }) }, badge.id));
                    }), upcomingBadges.map((upcoming, index) => (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "bg-[#022C22]/60 border border-[#059669]/60 rounded-[12px] p-4 text-center opacity-80", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx("div", { className: "p-3 bg-[#022C22] rounded-full border border-[#059669]", children: _jsx(Lock, { className: "w-6 h-6 text-[#059669]", strokeWidth: 1.75 }) }) }), _jsx("h3", { className: "font-extrabold text-[#D1FAE5] text-base mb-1", children: upcoming.title }), _jsx("div", { className: "bg-[#022C22] text-[#059669] border border-[#059669] text-xs font-extrabold px-3 py-1 rounded-full inline-block", children: upcoming.phoneme })] }, `upcoming-${index}`)))] }), _jsx(AnimatePresence, { children: newBadgeAnimation && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" }, className: "mt-6 bg-[#022C22] border border-[#059669] text-white rounded-[12px] p-4 text-center shadow-sm", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Award, { className: "w-5 h-5 text-[#34D399]", strokeWidth: 1.75 }), _jsx("span", { className: "font-black text-lg text-white", children: "Badge unlocked" }), _jsx(Award, { className: "w-5 h-5 text-[#34D399]", strokeWidth: 1.75 })] }) })) })] }));
}
