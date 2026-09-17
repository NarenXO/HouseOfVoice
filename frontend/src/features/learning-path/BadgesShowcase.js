import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Shield, Sparkles, Trophy, Lock, Award } from "lucide-react";
import axios from "axios";
const API_BASE = "http://localhost:8000/api";
const ICON_MAP = {
    star: Star,
    shield: Shield,
    sparkles: Sparkles,
    trophy: Trophy,
    award: Award,
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
        const IconComponent = ICON_MAP[iconName] || Star;
        return _jsx(IconComponent, { className: "w-8 h-8" });
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "text-gray-500", children: "Loading achievements..." }) }) }));
    }
    if (error || !badgesData) {
        return (_jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "text-red-500", children: error || "No data available" }) }) }));
    }
    const unlockedBadges = badgesData.badges;
    const totalBadges = unlockedBadges.length;
    // Mock upcoming badges for display
    const upcomingBadges = [
        { phoneme: "/r/", title: "Master /r/ to unlock" },
        { phoneme: "/th/", title: "Master /th/ to unlock" },
    ];
    return (_jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Trophy, { className: "w-6 h-6 text-amber-500" }), "Clinical Achievements & Badges"] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: "Earned by mastering sounds in new words" })] }), _jsxs("div", { className: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-semibold", children: [totalBadges, " ", totalBadges === 1 ? "Badge" : "Badges"] })] }), totalBadges === 0 && (_jsxs("div", { className: "text-center py-8", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4", children: _jsx(Lock, { className: "w-8 h-8 text-gray-400" }) }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 text-sm", children: "Complete your first checkpoint probe to unlock your first badge!" })] })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [unlockedBadges.map((badge, index) => {
                        const isNew = badge.id === newBadgeAnimation;
                        const IconComponent = ICON_MAP[badge.icon] || Star;
                        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20, scale: 0.8 }, animate: {
                                opacity: 1,
                                y: 0,
                                scale: isNew ? [1, 1.1, 1] : 1
                            }, transition: { delay: index * 0.1, duration: 0.5 }, whileHover: { scale: 1.05, y: -5 }, className: `relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 rounded-xl p-4 shadow-md ${isNew
                                ? "border-amber-400 dark:border-amber-500 shadow-amber-200 dark:shadow-amber-800"
                                : "border-amber-200 dark:border-amber-800"}`, children: [_jsx(AnimatePresence, { children: isNew && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: [0, 1, 0] }, exit: { opacity: 0 }, transition: { duration: 2 }, className: "absolute inset-0 bg-amber-400/20 rounded-xl" })) }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx(motion.div, { animate: isNew ? { rotate: [0, 360] } : {}, transition: { duration: 1, ease: "easeInOut" }, className: "p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full", children: _jsx(IconComponent, { className: "w-8 h-8 text-amber-600 dark:text-amber-400" }) }) }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-white text-sm mb-1", children: badge.title }), _jsx("div", { className: "flex items-center gap-2 mb-2", children: _jsx("span", { className: "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full", children: badge.phoneme }) }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: badge.description }), isNew && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold", children: "NEW!" }))] })] }, badge.id));
                    }), upcomingBadges.map((upcoming, index) => (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 0.5 }, className: "bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx("div", { className: "p-3 bg-gray-200 dark:bg-gray-700 rounded-full", children: _jsx(Lock, { className: "w-6 h-6 text-gray-400" }) }) }), _jsx("h3", { className: "font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1", children: upcoming.title }), _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full inline-block", children: upcoming.phoneme })] }, `upcoming-${index}`)))] }), _jsx(AnimatePresence, { children: newBadgeAnimation && (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "mt-6 bg-gradient-to-r from-amber-400 to-yellow-400 text-white rounded-lg p-4 text-center", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Sparkles, { className: "w-5 h-5" }), _jsx("span", { className: "font-bold", children: "\uD83C\uDF89 New Badge Unlocked!" }), _jsx(Sparkles, { className: "w-5 h-5" })] }) })) })] }));
}
