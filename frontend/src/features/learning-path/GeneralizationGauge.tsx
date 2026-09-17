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
    if (rate >= 0.8) return "#16A34A"; // Success (High Generalization)
    if (rate >= 0.5) return "#D97706"; // Warning (Developing)
    return "#0D9488"; // Accent (Early Training)
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
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-[#64748B]">Loading generalization data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-[#DC2626]">{error || "No data available"}</div>
        </div>
      </div>
    );
  }

  const percentage = Math.round(data.overall_rate * 100);
  const gaugeColor = getGaugeColor(data.overall_rate);
  const statusText = getStatusText(data.overall_rate);
  const topPhoneme = getTopPhoneme();

  // Calculate SVG circle parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.overall_rate * circumference);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
      {/* Section Label */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Generalization by context</h3>
      </div>

      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">
            Generalization index
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Untrained word mastery rate
          </p>
        </div>
        <div className="relative group">
          <Info className="w-5 h-5 text-[#64748B] cursor-help" strokeWidth={1.75} />
          <div className="absolute right-0 top-6 w-64 p-3 bg-[#0F172A] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
            Measures speech accuracy on words never practiced in therapy.
          </div>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke={gaugeColor}
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
              <div className="text-4xl font-bold font-mono tabular-nums text-[#0F172A]" style={{ color: gaugeColor }}>
                {percentage}%
              </div>
              <div className="text-xs text-[#64748B] mt-1">{statusText}</div>
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
          className="bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-3 mb-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#0F172A]">
              {topPhoneme.phoneme} is generalized. Ready for conversational transfer.
            </span>
          </div>
        </motion.div>
      )}

      {/* Phoneme Breakdown */}
      <div className="space-y-3">
        {data.phonemes.map((phoneme) => {
          const phonemePercentage = Math.round(phoneme.rate * 100);
          const phonemeColor = getGaugeColor(phoneme.rate);

          return (
            <motion.div
              key={phoneme.phoneme}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-8 flex items-center justify-center bg-[#F4F6F8] rounded-md font-mono text-sm font-semibold text-[#0F172A]">
                {phoneme.phoneme}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phonemePercentage}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: phonemeColor }}
                  />
                </div>
              </div>
              <div className="text-xs text-[#64748B] whitespace-nowrap font-mono tabular-nums">
                {phoneme.probes_passed} / {phoneme.probes_attempted} ({phonemePercentage}%)
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
        <div className="flex justify-between text-sm">
          <span className="text-[#64748B]">
            Total probes attempted
          </span>
          <span className="font-semibold text-[#0F172A] font-mono tabular-nums">
            {data.total_probes_attempted}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-[#64748B]">
            Total probes passed
          </span>
          <span className="font-semibold text-[#0F172A] font-mono tabular-nums">
            {data.total_probes_passed}
          </span>
        </div>
      </div>
    </div>
  );
}
