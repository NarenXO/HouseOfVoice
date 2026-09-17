import React from 'react';
import { SPEECH_ASSETS } from './assets/SpeechAnatomyAssets';

interface PhonemeVisualizerProps {
  activeAssets?: string[];
  phoneme?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_PHONEME_ASSETS: Record<string, string[]> = {
  '/r/': ['palate_teeth_upper_lower', 'mouth_rounded', 'tongue_retroflex_curl', 'air_central_stream', 'vocal_vibration_glow'],
  '/s/': ['palate_teeth_upper_lower', 'mouth_spread', 'tongue_alveolar_groove', 'air_friction_burst'],
  '/th/': ['palate_teeth_upper_lower', 'mouth_open_wide', 'tongue_interdental', 'air_soft_continuous'],
  '/b/': ['palate_teeth_upper_lower', 'mouth_bilabial_closed', 'tongue_neutral', 'air_plosive_release', 'vocal_vibration_glow'],
};

export default function PhonemeVisualizer({
  phoneme = '/r/',
  activeAssets,
  size = 'md',
}: PhonemeVisualizerProps) {
  const assetsToRender = activeAssets || DEFAULT_PHONEME_ASSETS[phoneme] || DEFAULT_PHONEME_ASSETS['/r/'];

  const sizeClasses = {
    sm: 'max-w-[200px] max-h-[200px] p-2',
    md: 'max-w-[280px] max-h-[280px] p-3',
    lg: 'max-w-[320px] max-h-[320px] p-4',
  }[size];

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden ${sizeClasses}`}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {assetsToRender.map((assetId) => {
          const AssetComponent = SPEECH_ASSETS[assetId];
          if (!AssetComponent) return null;
          return <AssetComponent key={assetId} isAnimated={true} />;
        })}
      </svg>
    </div>
  );
}
