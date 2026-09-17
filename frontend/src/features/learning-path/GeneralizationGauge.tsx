import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

interface PhonemeScore {
  phoneme: string;
  probes_attempted: number;
  probes_passed: number;
  rate: number;
  last_updated: string;
}

interface GeneralizationData {
  case_id: string;
  overall_rate: number;
  total_probes_attempted: number;
  total_probes_passed: number;
  phonemes: PhonemeScore[];
}

interface GeneralizationGaugeProps {
  caseId: string;
  refreshTrigger?: number;
}

export default function GeneralizationGauge({ caseId, refreshTrigger = 0 }: GeneralizationGaugeProps) {
  const [data, setData] = useState<GeneralizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeneralizationData();
  }, [caseId, refreshTrigger]);

  const fetchGeneralizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/learning/generalization/${caseId}`);
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch generalization data:", err);
      // Fallback to mock data
      try {
        const mockResponse = await fetch("/shared/mocks/generalization_score.mock.json");
        const mockData = await mockResponse.json();
        setData(mockData);
      } catch (mockErr) {
        setError("Failed to load generalization data");
      }
    } finally {
      setLoading(false);
    }
  };

  const getGaugeColor = (rate: number) => {
    if (rate >= 0.8) return "#0D9488"; // Teals for high generalization
    if (rate >= 0.5) return "#0D9488";
    return "#0D9488";
  };

  const getStatusText = (rate: number) => {
    if (rate >= 0.8) return "High generalization";
    if (rate >= 0.5) return "Developing";
    return "Early training";
  };

  const getTopPhoneme = () => {
    if (!data || data.phonemes.length === 0) return null;
    return data.phonemes.reduce((best, current) => 
      current.rate > best.rate ? current : best
    );
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-[#1E293B] font-bold">Loading generalization data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-[#DC2626] font-extrabold">{error || "No data available"}</div>
        </div>
      </div>
    );
  }

  const percentage = Math.round(data.overall_rate * 100);
  const statusText = getStatusText(data.overall_rate);
  const topPhoneme = getTopPhoneme();

  // Calculate SVG circle parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.overall_rate * circumference);

  return (
    <div className="bg-white border-2 border-[#059669] rounded-[16px] p-6 shadow-sm">
      {/* Section Label */}
      <div className="mb-1.5">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#047857]">GENERALIZATION BY CONTEXT</h3>
      </div>

      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#022C22] tracking-tight">
            Generalization index
          </h2>
          <p className="text-sm font-bold text-[#1E293B] mt-1">
            Untrained word mastery rate
          </p>
        </div>
        <div className="relative group">
          <Info className="w-5 h-5 text-[#1E293B] cursor-help" strokeWidth={1.75} />
          <div className="absolute right-0 top-6 w-64 p-3 bg-[#022C22] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-bold">
            Measures speech accuracy on words never practiced in therapy.
          </div>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#D1FAE5"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#059669"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={refreshTrigger}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <div className="text-5xl font-black text-[#022C22] tabular-nums tracking-tight">
                {percentage}%
              </div>
              <div className="text-xs font-extrabold text-[#047857] mt-1">{statusText}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Key Clinical Insight */}
      {topPhoneme && topPhoneme.rate >= 0.8 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#064E3B] border border-[#0D9488] rounded-[12px] p-4 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white">
              {topPhoneme.phoneme} is generalized. Ready for conversational transfer.
            </span>
          </div>
        </motion.div>
      )}

      {/* Phoneme Breakdown */}
      <div className="space-y-3">
        {data.phonemes.map((phoneme) => {
          const phonemePercentage = Math.round(phoneme.rate * 100);

          return (
            <motion.div
              key={phoneme.phoneme}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#064E3B] text-white border border-[#0D9488] rounded-[12px] p-3 flex items-center gap-3 shadow-sm"
            >
              <div className="w-12 h-8 flex items-center justify-center bg-[#CCFBF1] text-[#064E3B] font-black rounded-md text-xs font-mono">
                {phoneme.phoneme}
              </div>
              <div className="flex-1">
                <div className="h-3 bg-[#047857] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phonemePercentage}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full bg-[#34D399] rounded-full"
                  />
                </div>
              </div>
              <div className="text-sm text-white whitespace-nowrap tabular-nums font-extrabold">
                {phoneme.probes_passed} / {phoneme.probes_attempted} ({phonemePercentage}%)
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Stats Inner Accent Panel */}
      <div className="bg-[#064E3B] border border-[#0D9488] rounded-[12px] p-4 mt-6 shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="font-extrabold text-white text-sm">
            Total probes attempted
          </span>
          <span className="font-black text-[#CCFBF1] text-lg tabular-nums">
            {data.total_probes_attempted}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="font-extrabold text-white text-sm">
            Total probes passed
          </span>
          <span className="font-black text-[#CCFBF1] text-lg tabular-nums">
            {data.total_probes_passed}
          </span>
        </div>
      </div>
    </div>
  );
}
