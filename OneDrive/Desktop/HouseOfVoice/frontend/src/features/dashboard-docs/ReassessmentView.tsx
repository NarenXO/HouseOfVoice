import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Reassessment {
  id: string;
  case_id: string;
  baseline_snapshot: any;
  current_snapshot: any;
  improvement_summary: string;
  assessed_at: string;
}

interface ReassessmentViewProps {
  caseId: string;
}

export default function ReassessmentView({ caseId }: ReassessmentViewProps) {
  const [reassessment, setReassessment] = useState<Reassessment | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Score input states
  const [clarityScore, setClarityScore] = useState<number | ''>('');
  const [fluencyScore, setFluencyScore] = useState<number | ''>('');
  const [pronunciationScore, setPronunciationScore] = useState<number | ''>('');
  const [voiceStabilityScore, setVoiceStabilityScore] = useState<number | ''>('');

  const runReassessment = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch('/api/docs/reassessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          case_id: caseId,
          clarity_score: clarityScore !== '' ? clarityScore / 100 : null,
          fluency_score: fluencyScore !== '' ? fluencyScore / 100 : null,
          pronunciation_score: pronunciationScore !== '' ? pronunciationScore / 100 : null,
          voice_stability_score: voiceStabilityScore !== '' ? voiceStabilityScore / 100 : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReassessment(data);
      } else {
        throw new Error('Failed to run reassessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const formatScore = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  const calculateChange = (baseline: number, current: number) => {
    const change = (current - baseline) * 100;
    return {
      value: change,
      isPositive: change >= 0
    };
  };

  const formatDecimalScore = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  const prepareChartData = () => {
    if (!reassessment) return [];

    const baseline = reassessment.baseline_snapshot;
    const current = reassessment.current_snapshot;
    const data: any[] = [];

    // Add phoneme scores
    if (baseline.phoneme_scores && current.phoneme_scores) {
      Object.keys(baseline.phoneme_scores).forEach(phoneme => {
        data.push({
          name: `/${phoneme}/`,
          baseline: baseline.phoneme_scores[phoneme] * 100,
          current: current.phoneme_scores[phoneme] * 100
        });
      });
    }

    // Add fluency score
    if (baseline.fluency_score !== undefined && current.fluency_score !== undefined) {
      data.push({
        name: 'Fluency',
        baseline: baseline.fluency_score * 100,
        current: current.fluency_score * 100
      });
    }

    // Add language score
    if (baseline.language_score !== undefined && current.language_score !== undefined) {
      data.push({
        name: 'Language',
        baseline: baseline.language_score * 100,
        current: current.language_score * 100
      });
    }

    return data;
  };

  const getComparisonRows = () => {
    if (!reassessment) return [];

    const baseline = reassessment.baseline_snapshot;
    const current = reassessment.current_snapshot;
    const rows: any[] = [];

    // Add phoneme scores
    if (baseline.phoneme_scores && current.phoneme_scores) {
      Object.keys(baseline.phoneme_scores).forEach(phoneme => {
        const change = calculateChange(baseline.phoneme_scores[phoneme], current.phoneme_scores[phoneme]);
        rows.push({
          metric: `/${phoneme}/ Phoneme`,
          baseline: formatScore(baseline.phoneme_scores[phoneme]),
          current: formatScore(current.phoneme_scores[phoneme]),
          change: change,
          changeText: `${change.value >= 0 ? '+' : ''}${change.value.toFixed(0)}pp`
        });
      });
    }

    // Add fluency score
    if (baseline.fluency_score !== undefined && current.fluency_score !== undefined) {
      const change = calculateChange(baseline.fluency_score, current.fluency_score);
      rows.push({
        metric: 'Fluency',
        baseline: formatScore(baseline.fluency_score),
        current: formatScore(current.fluency_score),
        change: change,
        changeText: `${change.value >= 0 ? '+' : ''}${change.value.toFixed(0)}pp`
      });
    }

    // Add language score
    if (baseline.language_score !== undefined && current.language_score !== undefined) {
      const change = calculateChange(baseline.language_score, current.language_score);
      rows.push({
        metric: 'Language Skills',
        baseline: formatScore(baseline.language_score),
        current: formatScore(current.language_score),
        change: change,
        changeText: `${change.value >= 0 ? '+' : ''}${change.value.toFixed(0)}pp`
      });
    }

    return rows;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reassessment</h1>
        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
          {caseId}
        </div>
      </div>

      {/* Score Input Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Re-evaluation Scores (Optional)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter current re-evaluated scores to compute exact improvement deltas. Leave blank to derive from session data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speech Clarity (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={clarityScore}
              onChange={(e) => setClarityScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fluency (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={fluencyScore}
              onChange={(e) => setFluencyScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pronunciation (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={pronunciationScore}
              onChange={(e) => setPronunciationScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Stability (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={voiceStabilityScore}
              onChange={(e) => setVoiceStabilityScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0-100"
            />
          </div>
        </div>

        {/* Run Reassessment Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runReassessment}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Reassessment'}</span>
          </motion.button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Reassessment Results */}
      {reassessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Comparison Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Baseline vs Current Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Baseline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getComparisonRows().map((row, index) => (
                    <motion.tr
                      key={`comparison-${row.metric}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.baseline}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.current}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                          row.change.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {row.change.isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {row.changeText}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Improvement Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Improvement Summary</h3>
            <p className="text-gray-700 leading-relaxed">{reassessment.improvement_summary}</p>
          </div>

          {/* Visual Comparison Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Score']}
                />
                <Legend />
                <Bar dataKey="baseline" fill="#9ca3af" name="Baseline" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#6366f1" name="Current" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Assessment Date */}
          <div className="text-sm text-gray-500 text-center">
            Assessed on {new Date(reassessment.assessed_at).toLocaleString()}
          </div>
        </motion.div>
      )}
    </div>
  );
}
