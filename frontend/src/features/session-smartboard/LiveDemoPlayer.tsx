import React, { useState, useEffect } from 'react';

interface LiveDemoPlayerProps {
  ws: WebSocket | null;
  roomId: string;
}

interface DemoStep {
  step_number: number;
  duration_ms: number;
  asset_ids: string[];
  narration_text: string;
  articulatory_cue: string;
}

interface DemoData {
  id: string;
  phoneme: string;
  word?: string;
  total_duration_ms: number;
  steps: DemoStep[];
}

const PHONEME_GUIDANCE: Record<string, {
  tongue: string;
  lipJaw: string;
  airflow: string;
  vocal: string;
  defaultScript: string;
}> = {
  '/r/': {
    tongue: 'Curl tongue tip backward toward hard palate without touching. Elevate tongue dorsum slightly.',
    lipJaw: 'Slightly rounded O-shape, relaxed jaw. Lips protruded minimally.',
    airflow: 'Central laminar airflow stream over tongue dorsum. Smooth, continuous flow.',
    vocal: 'Voiced sound — vocal cords vibrating. Laryngeal activation required.',
    defaultScript: 'Let\'s practice making the /r/ sound for Rabbit. Round your lips slightly into an O-shape, curl the tip of your tongue backward, and vibrate your voice!'
  },
  '/s/': {
    tongue: 'Raise tongue blade toward alveolar ridge with a narrow central groove.',
    lipJaw: 'Teeth close together in a slight smile position.',
    airflow: 'High-frequency central friction burst through incisors.',
    vocal: 'Unvoiced sound — vocal cords resting.',
    defaultScript: 'Keep your teeth close together like a smile, raise your tongue near the top ridge, and blow a gentle hiss of air!'
  },
  '/th/': {
    tongue: 'Place tongue tip lightly between upper and lower front teeth.',
    lipJaw: 'Mouth slightly open, relaxed jaw.',
    airflow: 'Gentle continuous airflow over tongue tip.',
    vocal: 'Unvoiced sound — soft continuous stream.',
    defaultScript: 'Put your tongue tip gently between your front teeth and blow a soft breath of air across it!'
  },
  '/b/': {
    tongue: 'Tongue resting flat on floor of mouth.',
    lipJaw: 'Press upper and lower lips firmly together.',
    airflow: 'Build air pressure behind lips, then sudden plosive release.',
    vocal: 'Voiced sound — vocal cords engaged before release.',
    defaultScript: 'Press your lips firmly together, turn on your voice in your throat, and pop your lips open!'
  }
};

export default function LiveDemoPlayer({ ws, roomId }: LiveDemoPlayerProps) {
  const [selectedPhoneme, setSelectedPhoneme] = useState<string>('/r/');
  const [wordPrompt, setWordPrompt] = useState<string>('Rabbit');
  const [loading, setLoading] = useState<boolean>(false);
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'demo_sync' && data.action === 'play') {
          setDemoData(data.demoData);
          setCurrentStepIdx(data.currentStep || 0);
        }
      } catch (err) {
        console.error('Demo sync error:', err);
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/session/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneme: selectedPhoneme,
          word: wordPrompt,
          age_band: 'child-6-8',
          language: 'en-US',
        }),
      });

      if (res.ok) {
        const data: DemoData = await res.json();
        setDemoData(data);
        setCurrentStepIdx(0);
        if (data.steps && data.steps[0]) {
          speakText(data.steps[0].narration_text);
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Backend demo call failed, using client fallback:', err);
      const guidance = PHONEME_GUIDANCE[selectedPhoneme] || PHONEME_GUIDANCE['/r/'];
      const fallbackData: DemoData = {
        id: 'demo_' + Date.now(),
        phoneme: selectedPhoneme,
        word: wordPrompt,
        total_duration_ms: 9000,
        steps: [
          {
            step_number: 1,
            duration_ms: 3000,
            asset_ids: [],
            narration_text: `Let's practice the ${selectedPhoneme} sound for ${wordPrompt}. Start in a relaxed position.`,
            articulatory_cue: '1. RESTING POSITION'
          },
          {
            step_number: 2,
            duration_ms: 3000,
            asset_ids: [],
            narration_text: guidance.defaultScript,
            articulatory_cue: '2. TONGUE & LIP PLACEMENT'
          },
          {
            step_number: 3,
            duration_ms: 3000,
            asset_ids: [],
            narration_text: `Now say: ${wordPrompt}! Great job!`,
            articulatory_cue: '3. VOCALIZATION & REPETITION'
          }
        ]
      };
      setDemoData(fallbackData);
      setCurrentStepIdx(0);
      speakText(fallbackData.steps[0].narration_text);
    } finally {
      setLoading(false);
    }
  };

  const guidance = PHONEME_GUIDANCE[selectedPhoneme] || PHONEME_GUIDANCE['/r/'];
  const activeStep = demoData?.steps?.[currentStepIdx];
  const activeNarration = activeStep?.narration_text || guidance.defaultScript;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xl overflow-y-auto space-y-4">
      {/* Header Controls */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
        <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
          🎬 Generate Procedural Speech Demo
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Phoneme:</span>
            {['/r/', '/s/', '/th/', '/b/'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPhoneme(p)}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition ${
                  selectedPhoneme === p ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
            <span className="text-slate-400">Target Word:</span>
            <input
              type="text"
              value={wordPrompt}
              onChange={(e) => setWordPrompt(e.target.value)}
              placeholder="e.g. Rabbit"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={generateDemo}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow"
          >
            {loading ? '⏳ Generating...' : '✨ Generate Demo'}
          </button>
        </div>
      </div>

      {/* TEXT BOX 1: Clinical Anatomical Placement */}
      <div className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
            📌 Clinical Anatomical Placement
          </span>
          <span className="text-xs text-slate-400 font-mono">Target: {selectedPhoneme}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700/60">
            <p className="text-emerald-400 font-semibold mb-1">👅 Tongue Position:</p>
            <p className="text-slate-200">{guidance.tongue}</p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700/60">
            <p className="text-indigo-400 font-semibold mb-1">👄 Lip & Jaw Shape:</p>
            <p className="text-slate-200">{guidance.lipJaw}</p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700/60">
            <p className="text-amber-400 font-semibold mb-1">💨 Airflow Channel:</p>
            <p className="text-slate-200">{guidance.airflow}</p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700/60">
            <p className="text-purple-400 font-semibold mb-1">🗣️ Vocal Vibration:</p>
            <p className="text-slate-200">{guidance.vocal}</p>
          </div>
        </div>
      </div>

      {/* TEXT BOX 2: Spoken Coaching Script */}
      <div className="w-full bg-indigo-950/80 border border-indigo-700/60 p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-indigo-300 font-bold text-xs uppercase tracking-wider bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
              🗣️ Spoken Coaching Script
            </span>
            {activeStep && (
              <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                {activeStep.articulatory_cue} (Step {activeStep.step_number}/{demoData?.steps?.length})
              </span>
            )}
          </div>

          <button
            onClick={() => speakText(activeNarration)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded text-xs transition flex items-center gap-1 shadow"
          >
            🔊 Listen / Speak Script
          </button>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-lg border border-indigo-900/40">
          <p className="text-sm md:text-base font-medium text-slate-100 italic leading-relaxed">
            "{activeNarration}"
          </p>
        </div>

        {demoData?.steps && demoData.steps.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">Step Timeline:</span>
            <div className="flex gap-2">
              {demoData.steps.map((s, idx) => (
                <button
                  key={s.step_number}
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    speakText(s.narration_text);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                    idx === currentStepIdx
                      ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Step {s.step_number}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
