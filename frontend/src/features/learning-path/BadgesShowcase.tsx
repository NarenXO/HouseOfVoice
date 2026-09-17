import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Shield, Sparkles, Trophy, Lock, Award } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

interface Badge {
  id: string;
  case_id: string;
  milestone_id: string;
  phoneme: string;
  title: string;
  description: string;
  icon: string;
  awarded_at: string;
}

interface BadgesData {
  case_id: string;
  total_badges: number;
  badges: Badge[];
}

interface BadgesShowcaseProps {
  caseId: string;
  refreshTrigger?: number;
}

const ICON_MAP: Record<string, any> = {
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  trophy: Trophy,
  award: Award,
};

export default function BadgesShowcase({ caseId, refreshTrigger = 0 }: BadgesShowcaseProps) {
  const [badgesData, setBadgesData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBadgeAnimation, setNewBadgeAnimation] = useState<string | null>(null);

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
    } catch (err) {
      console.error("Failed to fetch badges:", err);
      // Fallback to mock data
      try {
        const mockResponse = await fetch("/shared/mocks/badges.mock.json");
        const mockData = await mockResponse.json();
        setBadgesData(mockData);
      } catch (mockErr) {
        setError("Failed to load badges");
      }
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Star;
    return <IconComponent className="w-8 h-8" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading achievements...</div>
        </div>
      </div>
    );
  }

  if (error || !badgesData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">{error || "No data available"}</div>
        </div>
      </div>
    );
  }

  const unlockedBadges = badgesData.badges;
  const totalBadges = unlockedBadges.length;

  // Mock upcoming badges for display
  const upcomingBadges = [
    { phoneme: "/r/", title: "Master /r/ to unlock" },
    { phoneme: "/th/", title: "Master /th/ to unlock" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Clinical Achievements & Badges
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Earned by mastering sounds in new words
          </p>
        </div>
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-semibold">
          {totalBadges} {totalBadges === 1 ? "Badge" : "Badges"}
        </div>
      </div>

      {/* Empty state */}
      {totalBadges === 0 && (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4"
          >
            <Lock className="w-8 h-8 text-gray-400" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Complete your first checkpoint probe to unlock your first badge!
          </p>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unlocked Badges */}
        {unlockedBadges.map((badge, index) => {
          const isNew = badge.id === newBadgeAnimation;
          const IconComponent = ICON_MAP[badge.icon] || Star;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: isNew ? [1, 1.1, 1] : 1 
              }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 rounded-xl p-4 shadow-md ${
                isNew 
                  ? "border-amber-400 dark:border-amber-500 shadow-amber-200 dark:shadow-amber-800" 
                  : "border-amber-200 dark:border-amber-800"
              }`}
            >
              {/* Glow effect for new badge */}
              <AnimatePresence>
                {isNew && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 bg-amber-400/20 rounded-xl"
                  />
                )}
              </AnimatePresence>

              <div className="relative">
                {/* Icon */}
                <div className="flex items-center justify-center mb-3">
                  <motion.div
                    animate={isNew ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full"
                  >
                    <IconComponent className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                </div>

                {/* Content */}
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                  {badge.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {badge.phoneme}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {badge.description}
                </p>

                {/* New badge indicator */}
                {isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold"
                  >
                    NEW!
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Locked/Upcoming Badges */}
        {upcomingBadges.map((upcoming, index) => (
          <motion.div
            key={`upcoming-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1">
              {upcoming.title}
            </h3>
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full inline-block">
              {upcoming.phoneme}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Celebratory banner for new badge */}
      <AnimatePresence>
        {newBadgeAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-gradient-to-r from-amber-400 to-yellow-400 text-white rounded-lg p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">🎉 New Badge Unlocked!</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
