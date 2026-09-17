import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ShieldCheck, Medal, Lock } from "lucide-react";
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
  award: Award,
  shield: ShieldCheck,
  medal: Medal,
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
    const IconComponent = ICON_MAP[iconName] || Award;
    return <IconComponent className="w-8 h-8" strokeWidth={1.75} />;
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#A7E3D5] rounded-[14px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-[#475569] font-medium">Loading achievements...</div>
        </div>
      </div>
    );
  }

  if (error || !badgesData) {
    return (
      <div className="bg-white border border-[#A7E3D5] rounded-[14px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-[#DC2626] font-semibold">{error || "No data available"}</div>
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
    <div className="bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm">
      {/* Section Label */}
      <div className="mb-1.5">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#047857]">ACHIEVEMENTS</h3>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#022C22] tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#059669]" strokeWidth={1.75} />
            Achievements
          </h2>
          <p className="text-sm font-bold text-[#1E293B] mt-1">
            Earned by mastering sounds in new words
          </p>
        </div>
        <div className="bg-[#D1FAE5] text-[#047857] border border-[#059669] font-black px-3 py-1 rounded-full text-xs">
          {totalBadges} {totalBadges === 1 ? "Badge" : "Badges"}
        </div>
      </div>

      {/* Empty state */}
      {totalBadges === 0 && (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-block p-4 bg-[#F8FAFC] rounded-full mb-4 border border-[#CBD5E1]"
          >
            <Lock className="w-8 h-8 text-[#64748B]" strokeWidth={1.75} />
          </motion.div>
          <p className="text-[#1E293B] text-base font-extrabold">
            Complete your first checkpoint probe to unlock your first badge
          </p>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unlocked Badges */}
        {unlockedBadges.map((badge, index) => {
          const isNew = badge.id === newBadgeAnimation;
          const IconComponent = ICON_MAP[badge.icon] || Award;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isNew ? [1, 1.02, 1] : 1
              }}
              transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative bg-white border-2 border-[#059669] rounded-[12px] p-4 shadow-sm"
            >
              <div className="relative">
                {/* Icon */}
                <div className="flex items-center justify-center mb-3">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-3 bg-[#D1FAE5] rounded-full border border-[#059669]"
                  >
                    <IconComponent className="w-8 h-8 text-[#059669]" strokeWidth={1.75} />
                  </motion.div>
                </div>

                {/* Content */}
                <h3 className="font-black text-[#022C22] text-base mb-1 text-center">
                  {badge.title}
                </h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="bg-[#D1FAE5] text-[#047857] border border-[#059669] font-black px-3 py-1 rounded-full text-xs">
                    {badge.phoneme}
                  </span>
                </div>
                <p className="text-sm text-[#1E293B] font-bold text-center">
                  {badge.description}
                </p>

                {/* New badge indicator */}
                {isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute -top-2 -right-2 bg-[#059669] text-white text-xs px-2 py-0.5 rounded-full font-black shadow-sm"
                  >
                    New
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
            animate={{ opacity: 1 }}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] p-4 text-center"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-[#E2E8F0] rounded-full border border-[#CBD5E1]">
                <Lock className="w-6 h-6 text-[#64748B]" strokeWidth={1.75} />
              </div>
            </div>
            <h3 className="font-extrabold text-[#64748B] text-base mb-1">
              {upcoming.title}
            </h3>
            <div className="bg-[#E2E8F0] text-[#64748B] text-xs font-extrabold px-3 py-1 rounded-full inline-block">
              {upcoming.phoneme}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Celebratory banner for new badge */}
      <AnimatePresence>
        {newBadgeAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-6 bg-[#F0FDF4] border border-[#A7F3D0] text-[#022C22] rounded-[12px] p-4 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-[#059669]" strokeWidth={1.75} />
              <span className="font-black text-lg text-[#022C22]">Badge unlocked</span>
              <Award className="w-5 h-5 text-[#059669]" strokeWidth={1.75} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
