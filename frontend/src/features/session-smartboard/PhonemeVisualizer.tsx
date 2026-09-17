import { useState, useEffect } from "react";
import { SPEECH_ASSETS } from "./assets";

interface PhonemeVisualizerProps {
  ws: WebSocket | null;
  clientId: string;
  initialPhoneme?: string;
  initialAssets?: string[];
}

interface AnatomyCueMessage {
  type: "anatomy_cue_change";
  phoneme: string;
  activeAssets: string[];
}

const PHONEME_PRESETS = {
  "/r/": {
    name: "Retroflex /r/",
    assets: ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
    description: "Tongue curled back, lips rounded, voiced airflow"
  },
  "/s/": {
    name: "Sibilant /s/",
    assets: ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
    description: "Tongue groove near alveolar ridge, turbulent airflow"
  },
  "/th/": {
    name: "Interdental /th/",
    assets: ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
    description: "Tongue between teeth, gentle continuous airflow"
  },
  "/b/": {
    name: "Bilabial /b/",
    assets: ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
    description: "Lips closed, explosive release, voiced"
  }
};

export default function PhonemeVisualizer({ ws, clientId, initialPhoneme = "/r/", initialAssets }: PhonemeVisualizerProps) {
  const [activePhoneme, setActivePhoneme] = useState<string>(initialPhoneme);
  const [activeAssets, setActiveAssets] = useState<string[]>(PHONEME_PRESETS["/r/"].assets);
  const [isAnimated, setIsAnimated] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Handle initial assets from props
  useEffect(() => {
    if (initialAssets && initialAssets.length > 0) {
      setActiveAssets(initialAssets);
    }
  }, [initialAssets]);

  const handlePhonemeChange = (phoneme: string) => {
    const preset = PHONEME_PRESETS[phoneme as keyof typeof PHONEME_PRESETS];
    if (preset) {
      setActivePhoneme(phoneme);
      setActiveAssets(preset.assets);
      setAnimationPhase(0);
      
      // Broadcast change via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        const message: AnatomyCueMessage = {
          type: "anatomy_cue_change",
          phoneme,
          activeAssets: preset.assets,
        };
        ws.send(JSON.stringify(message));
      }
    }
  };

  const handleAnimationPhaseChange = (phase: number) => {
    setAnimationPhase(phase);
  };

  const getLayeredAssets = () => {
    const layerOrder = [
      "palate_teeth_upper_lower", // Layer 0: Anatomical reference
      "mouth_neutral", "mouth_open_wide", "mouth_spread", "mouth_rounded", "mouth_bilabial_closed", // Layer 1: Mouth shapes
      "tongue_neutral", "tongue_alveolar_touch", "tongue_alveolar_groove", "tongue_interdental", "tongue_retroflex_curl", "tongue_velar_back", // Layer 2: Tongue postures
      "air_central_stream", "air_friction_burst", "air_soft_continuous", "air_plosive_release", "vocal_vibration_glow", // Layer 3: Airflow & acoustic
    ];

    return activeAssets
      .filter(assetId => SPEECH_ASSETS[assetId])
      .sort((a, b) => layerOrder.indexOf(a) - layerOrder.indexOf(b));
  };

  const getPhaseDescription = () => {
    const phases = [
      "Resting Position",
      "Preparation",
      "Constriction", 
      "Release",
      "Sustained Production"
    ];
    return phases[animationPhase] || phases[0];
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="bg-slate-700 border-b border-slate-600 p-4">
        <h3 className="text-lg font-bold text-indigo-400 mb-2">Speech Articulation Visualizer</h3>
        <p className="text-sm text-slate-400">
          {PHONEME_PRESETS[activePhoneme as keyof typeof PHONEME_PRESETS]?.description}
        </p>
      </div>

      {/* Phoneme Presets */}
      <div className="bg-slate-700 border-b border-slate-600 p-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PHONEME_PRESETS).map(([phoneme, preset]) => (
            <button
              key={phoneme}
              onClick={() => handlePhonemeChange(phoneme)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePhoneme === phoneme
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-500"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Controls */}
      <div className="bg-slate-700 border-b border-slate-600 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Animation Phase:</span>
          <span className="text-sm font-medium text-emerald-400">{getPhaseDescription()}</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((phase) => (
            <button
              key={phase}
              onClick={() => handleAnimationPhaseChange(phase)}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                animationPhase === phase
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-500"
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="animateAssets"
            checked={isAnimated}
            onChange={(e) => setIsAnimated(e.target.checked)}
            className="w-4 h-4 text-indigo-500 rounded"
          />
          <label htmlFor="animateAssets" className="text-sm text-slate-300">
            Animate Assets
          </label>
        </div>
      </div>

      {/* Visualizer Display */}
      <div className="flex-1 bg-white relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-96 h-96">
            {getLayeredAssets().map((assetId) => {
              const AssetComponent = SPEECH_ASSETS[assetId];
              if (!AssetComponent) return null;

              return (
                <div
                  key={assetId}
                  className="absolute inset-0"
                  style={{
                    zIndex: activeAssets.indexOf(assetId),
                  }}
                >
                  <AssetComponent
                    className="w-full h-full"
                    isAnimated={isAnimated}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 rounded-lg p-3 text-xs">
          <div className="font-semibold text-slate-300 mb-2">Active Layers:</div>
          <div className="space-y-1">
            {getLayeredAssets().map((assetId) => (
              <div key={assetId} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-400">{assetId.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Info */}
      <div className="bg-slate-700 border-t border-slate-600 p-3">
        <div className="text-sm text-slate-400">
          <span className="font-medium">Active Phoneme:</span> {activePhoneme} | 
          <span className="font-medium ml-2">Layers:</span> {activeAssets.length}
        </div>
      </div>
    </div>
  );
}