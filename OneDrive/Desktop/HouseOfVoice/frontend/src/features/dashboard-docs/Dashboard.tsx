import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, TrendingUp, X } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Color palette for charts
const COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  teal: '#14b8a6',
  red: '#ef4444',
  gray: '#6b7280'
};

// Phoneme colors for generalization rate
const PHONEME_COLORS: Record<string, string> = {
  '/r/': COLORS.blue,
  '/s/': COLORS.green,
  '/th/': COLORS.purple,
  '/l/': COLORS.orange,
  '/k/': COLORS.teal,
  '/g/': COLORS.red
};

interface DashboardMetric {
  label: string;
  data: Array<{ date: string; value: number }>;
}

interface DashboardResponse {
  case_id: string;
  speech_clarity: DashboardMetric;
  fluency: DashboardMetric;
  pronunciation: DashboardMetric;
  voice_stability: DashboardMetric;
  attendance: DashboardMetric;
  milestone_progress: DashboardMetric;
  generalization_rate: Record<string, Array<{ date: string; value: number }>>;
  isolation_forest_alert: boolean;
  alert_message: string | null;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8000/docs/dashboard/CASE-001');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={`skeleton-${i}`} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={`skeleton-secondary-${i}`} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { isolation_forest_alert, alert_message, generalization_rate } = dashboardData;

  // Calculate attendance percentage
  const attendanceData = dashboardData.attendance.data;
  const attendedCount = attendanceData.filter((d) => d.value === 1).length;
  const attendancePercentage = Math.round((attendedCount / attendanceData.length) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Progress Dashboard</h1>
      </div>

      {/* Isolation Forest Alert Banner */}
      {isolation_forest_alert && !alertDismissed && alert_message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white relative"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{alert_message}</p>
            <button
              onClick={() => setAlertDismissed(true)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Generalization Rate Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Generalization Rate by Phoneme</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Measures how well skills transfer from therapy to natural speech — the gold standard of progress.
        </p>

        {/* Radial Bar Charts for Latest Values */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(generalization_rate).map(([phoneme, data], index) => {
            const latestValue = data[data.length - 1]?.value || 0;
            const percentage = Math.round(latestValue * 100);
            const color = PHONEME_COLORS[phoneme] || COLORS.blue;

            return (
              <motion.div
                key={phoneme}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 text-center"
              >
                <ResponsiveContainer width="100%" height={120}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    data={[{ name: phoneme, value: percentage }]}
                  >
                    <RadialBar
                      dataKey="value"
                      fill={color}
                      cornerRadius={10}
                      animationBegin={0}
                      animationDuration={1000}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-2">
                  <p className="text-lg font-bold" style={{ color }}>{percentage}%</p>
                  <p className="text-sm text-gray-600">{phoneme}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Line Charts for 12-Week Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(generalization_rate).map(([phoneme, data], index) => {
            const color = PHONEME_COLORS[phoneme] || COLORS.blue;

            return (
              <motion.div
                key={phoneme}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="h-32"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Core Speech Metrics (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { metric: dashboardData.speech_clarity, color: COLORS.blue },
          { metric: dashboardData.fluency, color: COLORS.green },
          { metric: dashboardData.pronunciation, color: COLORS.purple },
          { metric: dashboardData.voice_stability, color: COLORS.orange }
        ].map((item, index) => (
          <motion.div
            key={item.metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-4">{item.metric.label}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={item.metric.data}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={item.color} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={item.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={2}
                  stroke="#6b7280"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Score']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={item.color}
                  fillOpacity={1}
                  fill={`url(#gradient-${index})`}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        ))}
      </div>

      {/* Attendance and Milestone Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-4">
            Attendance ({attendancePercentage}%)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={2}
                stroke="#6b7280"
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value === 1 ? 'Attended' : 'Missed'}
                stroke="#6b7280"
              />
              <Tooltip
                formatter={(value: number) => [value === 1 ? 'Attended' : 'Missed', 'Status']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar
                dataKey="value"
                fill={(entry: { value: number }) => entry.value === 1 ? COLORS.green : COLORS.gray}
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Milestone Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Milestone Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashboardData.milestone_progress.data}>
              <defs>
                <linearGradient id="milestoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={2}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#6b7280"
              />
              <Tooltip
                formatter={(value: number) => [`${value} milestones`, 'Completed']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="stepAfter"
                dataKey="value"
                stroke={COLORS.teal}
                fillOpacity={1}
                fill="url(#milestoneGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
