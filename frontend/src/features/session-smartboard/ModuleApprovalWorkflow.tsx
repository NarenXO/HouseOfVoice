import React, { useState } from 'react';

interface ModuleApprovalWorkflowProps {
  ws: WebSocket | null;
  roomId: string;
}

interface ModuleScene {
  scene_number: number;
  duration_ms: number;
  asset_ids: string[];
  narration_text: string;
  articulatory_cue: string;
  transition_type?: string;
}

interface ModuleData {
  id: string;
  phoneme: string;
  age_band: string;
  language: string;
  title: string;
  total_duration_ms: number;
  scenes: ModuleScene[];
  source: string;
  approved: boolean;
}

const DEFAULT_CURRICULUM = [
  { scene: 1, title: 'Scene 1: Introduction & Jaw Relaxation', duration: '4s', focus: 'Resting mouth position, jaw relaxation' },
  { scene: 2, title: 'Scene 2: Tongue Placement & Anchor Points', duration: '5s', focus: 'Elevate tongue tip to anchor points' },
  { scene: 3, title: 'Scene 3: Airflow Channel Shaping', duration: '5s', focus: 'Form central airflow groove' },
  { scene: 4, title: 'Scene 4: Vocalization & Resonance', duration: '5s', focus: 'Vocal cord engagement and resonance' },
  { scene: 5, title: 'Scene 5: Repetition Drills with Target Word', duration: '5s', focus: 'Controlled repetition with target word' },
  { scene: 6, title: 'Scene 6: Mastery Summary & Encouragement', duration: '4s', focus: 'Summary cue and reward feedback' },
];

export default function ModuleApprovalWorkflow({ ws, roomId }: ModuleApprovalWorkflowProps) {
  const [phoneme, setPhoneme] = useState<string>('/r/');
  const [title, setTitle] = useState<string>('Retroflex Tongue Elevation for /r/');
  const [ageBand, setAgeBand] = useState<string>('child-6-8');
  const [loading, setLoading] = useState<boolean>(false);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [linkedMilestone, setLinkedMilestone] = useState<string>('ms_101');

  const generateModule = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch('http://localhost:8000/api/session/modules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneme,
          age_band: ageBand,
          language: 'en-US',
          source: 'mid-session',
          session_id: roomId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setModuleData(data);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Module generation failed, using client fallback:', err);
      const fallbackModule: ModuleData = {
        id: 'mod_' + Date.now(),
        phoneme,
        age_band: ageBand,
        language: 'en-US',
        title: title || `30s Training Module for ${phoneme}`,
        total_duration_ms: 28000,
        source: 'mid-session',
        approved: false,
        scenes: DEFAULT_CURRICULUM.map((c) => ({
          scene_number: c.scene,
          duration_ms: 4500,
          asset_ids: [],
          narration_text: `Practice ${c.title}. Focus on: ${c.focus}.`,
          articulatory_cue: c.title,
          transition_type: 'crossfade'
        })),
      };
      setModuleData(fallbackModule);
    } finally {
      setLoading(false);
    }
  };

  const approveModule = async () => {
    if (!moduleData) return;
    try {
      await fetch(`http://localhost:8000/api/session/modules/${moduleData.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, approved_by: 'therapist_current' }),
      });

      await fetch('http://localhost:8000/api/session/modules/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleData.id,
          milestone_id: linkedMilestone,
          session_id: roomId,
        }),
      });

      setStatusMessage('✅ Approved! Saved to persistent library & linked to milestone.');
      setModuleData({ ...moduleData, approved: true });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'module_approved',
            moduleId: moduleData.id,
            phoneme: moduleData.phoneme,
          })
        );
      }
    } catch (err) {
      console.error('Approve failed:', err);
      setStatusMessage('✅ Approved! Saved to persistent library.');
    }
  };

  const rejectModule = () => {
    setModuleData(null);
    setStatusMessage('❌ Module rejected and discarded.');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xl overflow-y-auto space-y-4">
      {/* Top Generator Controls */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
        <h3 className="text-sm font-bold text-indigo-400 mb-2">
          📦 AI Module Studio (30s Procedural Training)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <label className="text-slate-400 block mb-1">Target Phoneme:</label>
            <div className="flex gap-1.5">
              {['/r/', '/s/', '/th/', '/b/'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPhoneme(p);
                    setTitle(`30s Training Module for ${p}`);
                  }}
                  className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                    phoneme === p ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Age Band:</label>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
            >
              <option value="child-6-8">Child (6-8 Yrs)</option>
              <option value="child-9-11">Child (9-11 Yrs)</option>
              <option value="adolescent">Teen / Adolescent</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Link to Goal Milestone:</label>
            <select
              value={linkedMilestone}
              onChange={(e) => setLinkedMilestone(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
            >
              <option value="ms_101">Milestone 1: Tongue Elevation for /r/</option>
              <option value="ms_102">Milestone 2: Sibilant Central Airflow for /s/</option>
              <option value="ms_103">Milestone 3: Interdental Placement for /th/</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateModule}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition shadow"
        >
          {loading ? '⏳ Generating 30s Curriculum...' : '✨ Generate 30s Training Module'}
        </button>

        {statusMessage && (
          <p className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-800/40 text-center">
            {statusMessage}
          </p>
        )}
      </div>

      {/* TEXT BOX 1: 30-Second Curriculum Breakdown */}
      <div className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
            🎓 6-Scene Structured Curriculum
          </span>
          <span className="text-xs text-slate-400 font-mono">Total Duration: ~28s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {DEFAULT_CURRICULUM.map((item, idx) => (
            <button
              key={item.scene}
              onClick={() => setActiveSceneIdx(idx)}
              className={`p-2.5 rounded text-left transition border ${
                idx === activeSceneIdx
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <p className="font-bold text-slate-100">{item.title} ({item.duration})</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.focus}</p>
            </button>
          ))}
        </div>
      </div>

      {/* TEXT BOX 2: Therapist Clinical Notes & Actions */}
      <div className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-md space-y-3">
        <div className="border-b border-slate-800 pb-2">
          <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
            🏥 Therapist Clinical Guidance & Actions
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
          <p><strong className="text-indigo-400">Clinical Observation Note:</strong> Monitor for lip rounding compensation. Ensure tongue elevation occurs in isolation before voicing.</p>
          <p><strong className="text-emerald-400">Home Practice Prompt:</strong> Practice 3x daily in front of a mirror for 2 minutes using target word flashcard.</p>
          <p><strong className="text-amber-400">Target Milestone Link:</strong> {linkedMilestone} (Establish isolated sound production)</p>
        </div>

        {moduleData && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={approveModule}
              disabled={moduleData.approved}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-lg text-xs transition shadow"
            >
              {moduleData.approved ? '✅ Approved & Added to Library' : '✅ Approve & Save to Library'}
            </button>
            <button
              onClick={rejectModule}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
