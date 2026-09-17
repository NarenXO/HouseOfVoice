import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, BarChart3, X } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

interface MetricPoint {
  date: string;
  value: number;
}

interface DashboardMetric {
  label: string;
  data: MetricPoint[];
}

interface DashboardData {
  case_id: string;
  speech_clarity: DashboardMetric;
  fluency: DashboardMetric;
  pronunciation: DashboardMetric;
  voice_stability: DashboardMetric;
  attendance: DashboardMetric;
  milestone_progress: DashboardMetric;
  generalization_rate: Record<string, MetricPoint[]>;
  isolation_forest_alert: boolean;
  alert_message: string | null;
}

const PHONEME_COLORS: Record<string, string> = {
  '/r/': '#3b82f6',
  '/s/': '#10b981',
  '/th/': '#a855f7',
  '/l/': '#f97316'
};

export const Dashboard: React.FC<{ caseId?: string }> = ({ caseId = 'CASE-001' }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissAlert, setDismissAlert] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/docs/dashboard/${caseId}`);
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [caseId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <p className="font-semibold">{error || 'Dashboard unavailable'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatTooltipValue = (val: any) => {
    if (typeof val !== 'number') return [val, 'Score'];
    const num = val > 1 ? val : val * 100;
    return [`${num.toFixed(1)}%`, 'Score'];
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Progress Dashboard
          </h1>
          <p className="text-sm text-slate-500">Real-time longitudinal speech metrics & AI plateau detection</p>
        </div>
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          Case: {data.case_id}
        </div>
      </div>

      {/* Anomaly Alert Banner */}
      {data.isolation_forest_alert && !dismissAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-amber-500 to-red-500 text-white rounded-xl shadow-md flex items-start justify-between"
        >
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Isolation Forest Plateau Alert</h4>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                {data.alert_message || 'Anomalous trend detected in practice frequency vs speech clarity.'}
              </p>
            </div>
          </div>
          <button onClick={() => setDismissAlert(true)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Generalization Rate Headline (Hero Metric) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Generalization Rate by Phoneme
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Measures how well skills transfer from therapy to natural speech — the gold standard of progress.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.generalization_rate).map(([phoneme, points]) => {
            const lastVal = points[points.length - 1]?.value || 0;
            const pct = lastVal <= 1.0 ? Math.round(lastVal * 100) : Math.round(lastVal);
            const color = PHONEME_COLORS[phoneme] || '#3b82f6';

            return (
              <div key={phoneme} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{phoneme}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                    {pct}%
                  </span>
                </div>

                {/* Gauge Circle */}
                <div className="flex justify-center items-center py-2">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={201}
                        strokeDashoffset={201 - (201 * pct) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-slate-800">{pct}%</span>
                  </div>
                </div>

                {/* Mini Trend Line */}
                <div className="h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points}>
                      <Tooltip formatter={formatTooltipValue} labelFormatter={(lbl: any) => `Date: ${lbl}`} />
                      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Speech Metrics (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { key: 'speech_clarity', label: 'Speech Clarity', color: '#3b82f6' },
          { key: 'fluency', label: 'Fluency', color: '#10b981' },
          { key: 'pronunciation', label: 'Pronunciation', color: '#a855f7' },
          { key: 'voice_stability', label: 'Voice Stability', color: '#f97316' }
        ].map(({ key, label, color }) => {
          const metric = (data as any)[key] as DashboardMetric;
          if (!metric) return null;

          return (
            <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">{label}</h3>
                <span className="text-xs text-slate-500">12-Week Trend</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metric.data}>
                    <defs>
                      <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={formatTooltipValue} labelFormatter={(lbl: any) => `Date: ${lbl}`} />
                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${key})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Attendance Rate</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendance.data}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [v === 1 ? 'Attended' : 'Missed', 'Status']} labelFormatter={(lbl: any) => `Date: ${lbl}`} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Cumulative Milestones Completed</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.milestone_progress.data}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [v, 'Milestones']} labelFormatter={(lbl: any) => `Date: ${lbl}`} />
                <Area type="stepAfter" dataKey="value" stroke="#06b6d4" fill="#cff4fc" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
