import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Volume2, Target, Mic2,
  RotateCcw, Download, CheckCircle2, AlertCircle, Info, FileText
} from 'lucide-react';
import { ScreeningResult } from '../../shared/types';

const C = {
  navy: '#1E3A5F',
  teal: '#0D9488',
  tealSoft: '#CCFBF1',
  surface: '#FFFFFF',
  bg: '#F4F6F8',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const, delay } },
});

const SEVERITY = {
  mild: {
    label: 'Mild',
    textColor: '#16A34A',
    bg: '#DCFCE7',
    border: '#86EFAC',
    Icon: CheckCircle2,
  },
  moderate: {
    label: 'Moderate',
    textColor: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    Icon: Info,
  },
  severe: {
    label: 'Severe',
    textColor: '#DC2626',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    Icon: AlertCircle,
  },
} as const;

type SevKey = keyof typeof SEVERITY;

const PHONEME_POSITIONS: Record<string, string> = {
  s: 'end of words',
  th: 'start of words',
  r: 'medial position',
  l: 'final position',
  sh: 'initial and medial position',
  ch: 'initial position',
};

interface ScoreCardProps {
  label: string;
  value: string;
  sub: string;
  Icon: React.ElementType;
  barPct?: number;
  barColor?: string;
}

function ScoreCard({ label, value, sub, Icon, barPct, barColor }: ScoreCardProps) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <Icon size={20} strokeWidth={1.75} style={{ color: C.teal }} />
        <span className="text-2xl font-bold tabular-nums" style={{ color: C.textPrimary }}>
          {value}
        </span>
      </div>
      <div>
        <p className="text-xs tracking-wide font-semibold uppercase" style={{ color: C.teal }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: C.textSecondary }}>{sub}</p>
      </div>
      {barPct !== undefined && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barPct}%`, background: barColor || C.teal }}
          />
        </div>
      )}
    </div>
  );
}

function PhonemeRow({ phoneme, score }: { phoneme: string; score: number }) {
  const pct = Math.round((score <= 1 ? score * 100 : score));
  const isFlagged = score < 0.7;
  const barColor = score >= 0.7 ? C.success : score >= 0.5 ? C.warning : C.danger;
  
  return (
    <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-sm" style={{ color: C.textPrimary }}>/{phoneme}/</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

interface Props {
  result: ScreeningResult;
  onReset?: () => void;
}

export const ScreeningResults: React.FC<Props> = ({ result, onReset }) => {
  const sevKey = (result.overall_severity?.toLowerCase() as SevKey) in SEVERITY
    ? (result.overall_severity.toLowerCase() as SevKey)
    : 'mild';
  const sev = SEVERITY[sevKey];
  const { Icon: SevIcon } = sev;

  const fluencyPct = (result.fluency_score <= 1 ? result.fluency_score * 100 : result.fluency_score);
  const languagePct = (result.language_score <= 1 ? result.language_score * 100 : result.language_score);

  const flaggedPhonemes = Object.entries(result.phoneme_scores)
    .filter(([, score]) => score < 0.7)
    .sort((a, b) => a[1] - b[1]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  return (
    <div className="space-y-6">

      {/* ── Summary header ── */}
      <motion.div {...fadeUp(0)}>
        <div
          className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} strokeWidth={1.75} style={{ color: C.teal }} />
              <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: C.teal }}>
                AI SCREENING SUMMARY
              </p>
            </div>
            <h2 className="text-xl font-bold" style={{ color: C.textPrimary }}>
              Baseline Speech Assessment
            </h2>
            <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
              Case {result.case_id} · {formatDate(result.created_at)}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg w-fit font-semibold text-sm"
            style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.textColor }}
          >
            <SevIcon size={16} strokeWidth={2} />
            {sev.label} Severity
          </div>
        </div>
      </motion.div>

      {/* ── Metric score cards ── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreCard
          label="Fluency"
          value={`${fluencyPct.toFixed(1)}%`}
          sub={fluencyPct >= 80 ? 'Excellent pacing' : fluencyPct >= 65 ? 'Good pacing' : 'Needs support'}
          Icon={Activity}
          barPct={fluencyPct}
          barColor={fluencyPct >= 70 ? C.success : fluencyPct >= 50 ? C.warning : C.danger}
        />
        <ScoreCard
          label="Clarity"
          value={`${languagePct.toFixed(1)}%`}
          sub={languagePct >= 80 ? 'Strong clarity' : languagePct >= 65 ? 'Fair clarity' : 'Needs work'}
          Icon={Volume2}
          barPct={languagePct}
          barColor={languagePct >= 70 ? C.success : languagePct >= 50 ? C.warning : C.danger}
        />
      </motion.div>

      {/* ── Phoneme Analysis ── */}
      <motion.div {...fadeUp(0.1)} className="rounded-xl p-6 shadow-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <p className="text-xs font-semibold tracking-wide uppercase mb-4" style={{ color: C.teal }}>
          Phoneme Accuracy Breakdown
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(result.phoneme_scores).map(([ph, score]) => (
            <PhonemeRow key={ph} phoneme={ph} score={score} />
          ))}
        </div>

        {flaggedPhonemes.length > 0 && (
          <div className="mb-6 border-t pt-6" style={{ borderColor: C.border }}>
            <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: C.danger }}>
              Flagged Errors
            </p>
            <div className="flex flex-wrap gap-2">
              {flaggedPhonemes.map(([ph, score]) => (
                <div
                  key={ph}
                  className="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 border"
                  style={{ background: '#FEF2F2', color: C.danger, borderColor: '#FCA5A5' }}
                >
                  <AlertCircle size={12} strokeWidth={2} />
                  <span>{ph} - {PHONEME_POSITIONS[ph] || 'various positions'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-xs font-medium" style={{ color: C.textSecondary }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: C.success }} />
            &ge;70% Adequate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: C.warning }} />
            50–69% Fair
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: C.danger }} />
            &lt;50% Focus
          </span>
        </div>
      </motion.div>

      {/* ── Clinical Observations ── */}
      <motion.div {...fadeUp(0.15)} className="rounded-xl p-6 shadow-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <p className="text-xs font-semibold tracking-wide uppercase mb-4" style={{ color: C.teal }}>
          Clinical Recommendations
        </p>
        {result.recommendations.length === 0 ? (
          <p className="text-sm" style={{ color: C.textSecondary }}>No specific recommendations at this time.</p>
        ) : (
          <ul className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={16} strokeWidth={2} style={{ color: C.teal, flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm leading-relaxed" style={{ color: C.textPrimary }}>{rec}</p>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* ── Action buttons ── */}
      <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row gap-3 pt-2">
        {onReset && (
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors border"
            style={{ borderColor: C.border, color: C.textSecondary, background: C.surface }}
          >
            <RotateCcw size={16} strokeWidth={1.75} />
            Retake Assessment
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white transition-colors hover:opacity-90"
          style={{ background: C.navy }}
        >
          <Download size={16} strokeWidth={1.75} />
          Export Summary
        </button>
      </motion.div>

    </div>
  );
};
