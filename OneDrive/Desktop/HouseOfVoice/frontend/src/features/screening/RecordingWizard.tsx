import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScreeningResult } from '../../shared/types';
import { uploadRecording, runPipeline } from './api';

interface Step {
  id: 'sentence' | 'picture' | 'spontaneous';
  title: string;
  icon: string;
  prompt: string;
}

const STEPS: Step[] = [
  {
    id: 'sentence',
    title: 'Sentence Reading',
    icon: '📖',
    prompt:
      '"The quick brown fox jumps over the lazy dog. She sells seashells by the seashore."',
  },
  {
    id: 'picture',
    title: 'Picture Description',
    icon: '🖼️',
    prompt:
      'Describe a busy playground or park scene in your own words. Mention who is there and what they are doing.',
  },
  {
    id: 'spontaneous',
    title: 'Spontaneous Speech',
    icon: '💬',
    prompt:
      'Tell us about your favourite weekend activity or a fun memory with your family.',
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
    setStepData((prev) => {
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
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
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

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setStepData((prev) => ({
          ...prev,
          [step.id]: { blob, url: URL.createObjectURL(blob) },
        }));
        setRecordState('recorded');
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mr.start(200);
      setElapsed(0);
      setRecordState('recording');
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
      setRecordState('idle');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

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
        setHighestStep((prev) => Math.max(prev, nextIndex));
        const nextStep = STEPS[nextIndex];
        setRecordState(stepData[nextStep.id] ? 'recorded' : 'idle');
      } else {
        // All steps done → run pipeline
        isPipelineError = true;
        setAnalyzing(true);
        const result = await runPipeline(caseId, newClipIds);
        onComplete(result);
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      if (msg.toLowerCase().includes('no speech') || msg.toLowerCase().includes('silent') || msg.toLowerCase().includes('could not decode') || msg.toLowerCase().includes('couldn\'t hear you clearly')) {
        msg = 'Analysis Failed: No speech detected in your audio. Please re-record your clips and speak clearly into the microphone.';
      }
      setError(msg);

      if (isPipelineError) {
        setAnalyzing(false);
        setRecordState('recorded');
      } else {
        setRecordState('recorded');
      }
    }
  };

  if (analyzing) {
    return (
      <div className="min-h-[480px] flex flex-col items-center justify-center gap-6 bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-3 rounded-full bg-indigo-50 flex items-center justify-center text-2xl">🧠</div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Analyzing Speech Sample</h2>
        <p className="text-slate-500 max-w-sm leading-relaxed text-sm">
          Analyzing acoustic features, transcribing phonemes, and evaluating speech metrics...
        </p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold text-lg">Baseline Speech Assessment</h2>
          <span className="text-indigo-200 text-sm font-medium">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        {/* Step tabs */}
        <div className="flex gap-2 mt-4">
          {STEPS.map((s, i) => {
            const isClickable = i <= highestStep;
            return (
              <div
                key={s.id}
                onClick={() => { if (isClickable) navigateToStep(i); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  i === stepIndex
                    ? 'bg-white text-indigo-700'
                    : isClickable
                    ? 'bg-white/30 text-white hover:bg-white/40'
                    : 'text-indigo-200'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {step.icon} {step.title}
          </h3>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-slate-700 text-sm leading-relaxed italic">
            {step.prompt}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {step.id === 'sentence'
              ? 'Read the text above clearly and naturally.'
              : 'Speak naturally for 30–60 seconds.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">🛑</span>
            <div className="text-sm font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-4">
          {recordState === 'idle' && (
            <button
              onClick={startRecording}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-150"
            >
              <span className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
              Start Recording
            </button>
          )}

          {recordState === 'recording' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 text-red-600 font-bold text-xl">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                {formatTime(elapsed)}
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all"
              >
                <span className="w-3 h-3 rounded-sm bg-white" />
                Stop Recording
              </button>
            </div>
          )}

          {(recordState === 'recorded' || recordState === 'uploading') && audioUrl && (
            <div className="w-full space-y-3">
              <audio controls src={audioUrl} className="w-full rounded-lg" />
              <div className="flex gap-3">
                <button
                  onClick={resetRecording}
                  disabled={recordState === 'uploading'}
                  className="flex-1 border border-slate-300 hover:border-slate-400 text-slate-700 font-medium py-2.5 rounded-xl transition disabled:opacity-40"
                >
                  🔄 Re-record
                </button>
                {stepIndex > 0 && (
                  <button
                    onClick={() => navigateToStep(stepIndex - 1)}
                    disabled={recordState === 'uploading'}
                    className="flex-1 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-semibold py-2.5 rounded-xl transition disabled:opacity-40"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  disabled={recordState === 'uploading'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {recordState === 'uploading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : stepIndex < STEPS.length - 1 ? (
                    'Continue →'
                  ) : (
                    '🚀 Analyze Speech'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
