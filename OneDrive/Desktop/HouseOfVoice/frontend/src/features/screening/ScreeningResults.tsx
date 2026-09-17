import React from 'react';
import { ScreeningResult } from '../../shared/types';

interface Props {
  result: ScreeningResult;
  onReset?: () => void;
}

const SEVERITY_CONFIG = {
  mild: {
    label: 'Mild',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
    icon: '✅',
  },
  moderate: {
    label: 'Moderate',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
    icon: '⚠️',
  },
  severe: {
    label: 'Severe',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    bar: 'bg-red-500',
    icon: '🔴',
  },
} as const;

type SeverityKey = keyof typeof SEVERITY_CONFIG;

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const rawPct = score <= 1 ? score * 100 : score;
  const pctStr = rawPct.toFixed(1);
  const pct = Math.round(rawPct);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <span className="text-2xl font-bold text-slate-800">{pctStr}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Fair' : 'Needs Support'}
      </p>
    </div>
  );
}

function PhonemeBar({ phoneme, score }: { phoneme: string; score: number }) {
  const rawPct = score <= 1 ? score * 100 : score;
  const pctStr = rawPct.toFixed(1);
  const pct = Math.round(rawPct);
  const color =
    score >= 0.7 ? 'bg-emerald-500' : score >= 0.5 ? 'bg-amber-400' : 'bg-red-400';
  const textColor =
    score >= 0.7 ? 'text-emerald-700' : score >= 0.5 ? 'text-amber-700' : 'text-red-700';
  const bgColor =
    score >= 0.7 ? 'bg-emerald-50' : score >= 0.5 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono font-bold text-slate-700 text-sm">/{phoneme}/</span>
        <span className={`text-xs font-semibold ${textColor}`}>{pctStr}%</span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const ScreeningResults: React.FC<Props> = ({ result, onReset }) => {
  const sev = (result.overall_severity.toLowerCase() as SeverityKey) in SEVERITY_CONFIG
    ? (result.overall_severity.toLowerCase() as SeverityKey)
    : 'mild';
  const cfg = SEVERITY_CONFIG[sev];

  return (
    <div className="space-y-5">
      {/* Report Header */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Baseline Speech Assessment Report</h2>
            <p className="text-sm text-slate-500 mt-1">
              Case ID: <span className="font-mono font-medium text-slate-700">{result.case_id}</span>
              {' · '}
              {formatDate(result.created_at)}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${cfg.badge} w-fit`}>
            <span>{cfg.icon}</span>
            <span>{cfg.label} Severity</span>
          </div>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreGauge
          score={result.fluency_score}
          label="Fluency Score"
          color={result.fluency_score >= 0.7 ? 'bg-indigo-500' : result.fluency_score >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}
        />
        <ScoreGauge
          score={result.language_score}
          label="Language / Clarity Score"
          color={result.language_score >= 0.7 ? 'bg-violet-500' : result.language_score >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}
        />
      </div>

      {/* Phoneme Accuracy */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          Phoneme Accuracy Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(result.phoneme_scores).map(([ph, score]) => (
            <PhonemeBar key={ph} phoneme={ph} score={score} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> &ge;70% Adequate</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> 50–69% Fair</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> &lt;50% Needs Focus</span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          Clinical Recommendations
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-0.5 text-indigo-500 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="flex-1 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-semibold py-3 rounded-xl transition-all hover:bg-indigo-50"
          >
            🔄 Retake Assessment
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Summary
        </button>
        <button
          className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 rounded-xl transition-all"
        >
          🗺️ View Therapy Plan
        </button>
      </div>
    </div>
  );
};
