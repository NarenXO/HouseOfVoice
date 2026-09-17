import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, RotateCcw, ChevronRight, Zap,
  AlertCircle, Loader2, CheckCircle2, BookOpen, Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { ScreeningResult } from '../../shared/types';
import { uploadRecording, runPipeline } from './api';

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

const C = {
  navy: '#1E3A5F',
  teal: '#0D9488',
  tealSoft: '#CCFBF1',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  danger: '#DC2626',
};

interface Step {
  id: 'sentence' | 'picture' | 'spontaneous';
  title: string;
  Icon: React.ElementType;
  prompt: string;
  hint: string;
}

const STEPS: Step[] = [
  {
    id: 'sentence',
    title: 'Sentence Reading',
    Icon: BookOpen,
    prompt: 'The quick brown fox jumps over the lazy dog. She sells seashells by the seashore.',
    hint: 'Read the passage clearly at a comfortable pace.',
  },
  {
    id: 'picture',
    title: 'Picture Description',
    Icon: ImageIcon,
    prompt: 'Describe a busy playground or park scene in your own words. Mention the people present and what they are doing.',
    hint: 'Speak naturally for 30 to 60 seconds.',
  },
  {
    id: 'spontaneous',
    title: 'Spontaneous Speech',
    Icon: MessageSquare,
    prompt: 'Tell us about your favourite weekend activity or a fun memory with your family.',
    hint: 'Speak freely and naturally for at least 30 seconds.',
  },
];

type RecordState = 'idle' | 'recording' | 'recorded' | 'uploading';

interface Props {
  caseId: string;
  onComplete: (result: ScreeningResult) => void;
}

export const RecordingWizard: React.FC<Props> = ({ caseId, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [stepData, setStepData] = useState<Record<string, { blob: Blob; url: string }>>({});
  const [elapsed, setElapsed] = useState(0);
  const [clipIds, setClipIds] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const step = STEPS[stepIndex];
  const audioBlob = stepData[step.id]?.blob || null;
  const audioUrl = stepData[step.id]?.url || null;

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const resetRecording = useCallback(() => {
    setStepData(prev => {
      const next = { ...prev };
      if (next[step.id]) {
        URL.revokeObjectURL(next[step.id].url);
        delete next[step.id];
      }
      return next;
    });
    setElapsed(0);
    setRecordState('idle');
    setError(null);
  }, [step.id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const navigateToStep = (index: number) => {
    if (index > highestStep) return;
    setStepIndex(index);
    const targetStep = STEPS[index];
    setRecordState(stepData[targetStep.id] ? 'recorded' : 'idle');
    setError(null);
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setStepData(prev => ({ ...prev, [step.id]: { blob, url: URL.createObjectURL(blob) } }));
        setRecordState('recorded');
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      mr.start(200);
      setElapsed(0);
      setRecordState('recording');
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
      setRecordState('idle');
    }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); };

  const handleContinue = async () => {
    if (!audioBlob) return;
    setRecordState('uploading');
    setError(null);
    let isPipelineError = false;
    try {
      const res = await uploadRecording(caseId, step.id, audioBlob);
      const newClipIds = { ...clipIds, [step.id]: res.clip_id };
      setClipIds(newClipIds);

      if (stepIndex < STEPS.length - 1) {
        const nextIndex = stepIndex + 1;
        setStepIndex(nextIndex);
        setHighestStep(prev => Math.max(prev, nextIndex));
        setRecordState(stepData[STEPS[nextIndex].id] ? 'recorded' : 'idle');
      } else {
        isPipelineError = true;
        setAnalyzing(true);
        const result = await runPipeline(caseId, newClipIds);
        onComplete(result);
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      if (
        msg.toLowerCase().includes('no speech') ||
        msg.toLowerCase().includes('silent') ||
        msg.toLowerCase().includes('could not decode') ||
        msg.toLowerCase().includes("couldn't hear")
      ) {
        msg = 'No speech detected in your recording. Please re-record and speak clearly into the microphone.';
      }
      setError(msg);
      if (isPipelineError) setAnalyzing(false);
      setRecordState('recorded');
    }
  };

  if (analyzing) {
    return (
      <motion.div
        {...fadeUp}
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
        className="rounded-xl shadow-sm p-12 flex flex-col items-center gap-6 text-center min-h-[400px] justify-center"
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: C.tealSoft }}>
          <Loader2 size={32} strokeWidth={1.75} style={{ color: C.teal }} className="animate-spin" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.teal }}>
            AI ANALYSIS IN PROGRESS
          </p>
          <h2 className="text-lg font-bold mb-1" style={{ color: C.textPrimary }}>
            Analyzing Your Speech Sample
          </h2>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: C.textSecondary }}>
            Running Whisper STT — Silero VAD — Acoustic Analysis — Gemini Summary...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...fadeUp}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
      className="rounded-xl shadow-sm overflow-hidden"
    >
      {/* ── Top bar ── */}
      <div style={{ background: C.navy }} className="px-6 py-5">
        <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: C.tealSoft }}>
          BASELINE SPEECH ASSESSMENT
        </p>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isClickable = i <= highestStep;
            const isActive = i === stepIndex;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => { if (isClickable) navigateToStep(i); }}
                  disabled={!isClickable}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border"
                  style={{
                    background: isActive ? C.tealSoft : 'rgba(255,255,255,0.1)',
                    borderColor: isActive ? C.teal : 'transparent',
                    color: isActive ? C.teal : 'rgba(255,255,255,0.6)',
                  }}
                  title={s.title}
                >
                  <s.Icon size={16} strokeWidth={1.75} />
                  <span className="text-xs font-medium hidden sm:inline">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div key={step.id} {...fadeUp}>
            <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.teal }}>
              STEP {stepIndex + 1}
            </p>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed font-medium"
              style={{ background: C.tealSoft, border: `1px solid #99F6E4`, color: C.textPrimary }}
            >
              {step.prompt}
            </div>
            <p className="text-xs mt-2" style={{ color: C.textSecondary }}>{step.hint}</p>
          </motion.div>
        </AnimatePresence>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ background: '#FEF2F2', border: `1px solid #FCA5A5` }}
          >
            <AlertCircle size={18} strokeWidth={1.75} style={{ color: C.danger, flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm font-medium" style={{ color: '#991B1B' }}>{error}</p>
          </motion.div>
        )}

        {/* Recording controls */}
        <div className="flex flex-col items-center gap-4 pt-2">
          {recordState === 'idle' && (
            <motion.button
              {...fadeUp}
              onClick={startRecording}
              className="flex items-center gap-3 px-8 py-3.5 rounded-lg font-medium text-white transition-colors"
              style={{ background: C.navy }}
            >
              <Mic size={18} strokeWidth={1.75} />
              Start Recording
            </motion.button>
          )}

          {recordState === 'recording' && (
            <motion.div {...fadeUp} className="flex flex-col items-center gap-3">
              <p className="text-2xl font-bold tabular-nums" style={{ color: C.danger }}>
                {formatTime(elapsed)}
              </p>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-medium text-white transition-colors"
                style={{ background: C.danger }}
              >
                <Square size={16} strokeWidth={2} />
                Stop Recording
              </button>
            </motion.div>
          )}

          {(recordState === 'recorded' || recordState === 'uploading') && audioUrl && (
            <motion.div {...fadeUp} className="w-full space-y-4">
              <audio controls src={audioUrl} className="w-full rounded-lg outline-none" />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetRecording}
                  disabled={recordState === 'uploading'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium border transition-colors disabled:opacity-40"
                  style={{ borderColor: C.border, color: C.textSecondary, background: C.surface }}
                >
                  <RotateCcw size={16} strokeWidth={1.75} />
                  Re-record
                </button>
                {stepIndex > 0 && (
                  <button
                    onClick={() => navigateToStep(stepIndex - 1)}
                    disabled={recordState === 'uploading'}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium border transition-colors disabled:opacity-40"
                    style={{ borderColor: C.border, color: C.textSecondary, background: C.surface }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  disabled={recordState === 'uploading'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-60"
                  style={{ background: C.teal }}
                >
                  {recordState === 'uploading' ? (
                    <>
                      <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                      Uploading...
                    </>
                  ) : stepIndex < STEPS.length - 1 ? (
                    <>
                      Continue
                      <ChevronRight size={16} strokeWidth={2} />
                    </>
                  ) : (
                    <>
                      <Zap size={16} strokeWidth={1.75} />
                      Analyze Speech
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
