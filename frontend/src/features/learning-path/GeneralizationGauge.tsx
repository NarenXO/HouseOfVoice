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
    if (rate >= 0.8) return "#10b981"; // Emerald (High Generalization)
    if (rate >= 0.5) return "#f59e0b"; // Amber (Developing)
    return "#3b82f6"; // Blue (Early Training)
  };

  const getStatusText = (rate: number) => {
    if (rate >= 0.8) return "High Generalization";
    if (rate >= 0.5) return "Developing";
    return "Early Training";
  };

  const getTopPhoneme = () => {
    if (!data || data.phonemes.length === 0) return null;
    return data.phonemes.reduce((best, current) => 
      current.rate > best.rate ? current : best
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading generalization data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-red-500">{error || "No data available"}</div>
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Clinical Generalization Index
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Untrained word mastery rate
          </p>
        </div>
        <div className="relative group">
          <Info className="w-5 h-5 text-gray-400 cursor-help" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
              stroke="#e5e7eb"
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
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={refreshTrigger}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold" style={{ color: gaugeColor }}>
                {percentage}%
              </div>
              <div className="text-xs text-gray-500 mt-1">{statusText}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Key Clinical Insight */}
      {topPhoneme && topPhoneme.rate >= 0.8 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="text-sm text-emerald-800 dark:text-emerald-300">
              {topPhoneme.phoneme} is generalized! Ready for conversational transfer.
            </span>
          </div>
        </motion.div>
      )}

      {/* Phoneme Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Phoneme Breakdown
        </h3>
        {data.phonemes.map((phoneme) => {
          const phonemePercentage = Math.round(phoneme.rate * 100);
          const phonemeColor = getGaugeColor(phoneme.rate);
          
          return (
            <motion.div
              key={phoneme.phoneme}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                {phoneme.phoneme}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phonemePercentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: phonemeColor }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {phoneme.probes_passed} / {phoneme.probes_attempted} ({phonemePercentage}%)
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total Probes Attempted
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {data.total_probes_attempted}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600 dark:text-gray-400">
            Total Probes Passed
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {data.total_probes_passed}
          </span>
        </div>
      </div>
    </div>
  );
}
