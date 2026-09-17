import React from "react";

interface AssetProps {
  className?: string;
  opacity?: number;
  transform?: string;
  isAnimated?: boolean;
}

// Mouth Base Shapes
export const MouthNeutral: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face profile outline */}
    <path d="M50 200 Q50 100 150 80 Q250 60 350 100 Q380 150 370 200 Q360 280 300 320 Q200 360 100 340 Q60 300 50 200" fill="#fef3c7" stroke="#0f172a" strokeWidth="2"/>
    
    {/* Neutral lips */}
    <path d="M120 200 Q200 190 280 200" stroke="#fb7185" strokeWidth="8" strokeLinecap="round" fill="none"/>
    
    {/* Upper teeth */}
    <rect x="130" y="195" width="120" height="15" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    
    {/* Lower teeth */}
    <rect x="130" y="210" width="120" height="15" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    
    {/* Tongue neutral */}
    <ellipse cx="200" cy="280" rx="80" ry="30" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
  </svg>
);

export const MouthOpenWide: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face profile */}
    <path d="M50 200 Q50 100 150 80 Q250 60 350 100 Q380 150 370 200 Q360 280 300 320 Q200 360 100 340 Q60 300 50 200" fill="#fef3c7" stroke="#0f172a" strokeWidth="2"/>
    
    {/* Open jaw */}
    <path d="M100 180 Q200 160 300 180" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M100 260 Q200 280 300 260" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" fill="none"/>
    
    {/* Upper teeth */}
    <rect x="120" y="175" width="160" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    
    {/* Lower teeth */}
    <rect x="120" y="245" width="160" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    
    {/* Tongue dropped */}
    <ellipse cx="200" cy="300" rx="100" ry="40" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
  </svg>
);

export const MouthSpread: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face profile */}
    <path d="M50 200 Q50 100 150 80 Q250 60 350 100 Q380 150 370 200 Q360 280 300 320 Q200 360 100 340 Q60 300 50 200" fill="#fef3c7" stroke="#0f172a" strokeWidth="2"/>
    
    {/* Spread lips (retracted) */}
    <path d="M110 195 Q200 185 290 195" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M110 215 Q200 225 290 215" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" fill="none"/>
    
    {/* Teeth visible */}
    <rect x="120" y="190" width="160" height="12" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    <rect x="120" y="208" width="160" height="12" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    
    {/* Tongue behind teeth */}
    <ellipse cx="200" cy="250" rx="90" ry="25" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
  </svg>
);

export const MouthRounded: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face profile */}
    <path d="M50 200 Q50 100 150 80 Q250 60 350 100 Q380 150 370 200 Q360 280 300 320 Q200 360 100 340 Q60 300 50 200" fill="#fef3c7" stroke="#0f172a" strokeWidth="2"/>
    
    {/* Rounded/pursed lips */}
    <ellipse cx="200" cy="200" rx="60" ry="30" fill="#fb7185" stroke="#dc2626" strokeWidth="3"/>
    
    {/* Small opening */}
    <ellipse cx="200" cy="200" rx="20" ry="10" fill="#1e293b"/>
    
    {/* Tongue curled back */}
    <path d="M180 220 Q160 250 180 280 Q200 300 220 280 Q240 250 220 220" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
  </svg>
);

export const MouthBilabialClosed: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face profile */}
    <path d="M50 200 Q50 100 150 80 Q250 60 350 100 Q380 150 370 200 Q360 280 300 320 Q200 360 100 340 Q60 300 50 200" fill="#fef3c7" stroke="#0f172a" strokeWidth="2"/>
    
    {/* Closed lips pressed together */}
    <path d="M140 200 Q200 190 260 200" stroke="#fb7185" strokeWidth="12" strokeLinecap="round" fill="none"/>
    <path d="M140 200 Q200 210 260 200" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" fill="none"/>
    
    {/* Slight pressure indication */}
    <ellipse cx="200" cy="200" rx="60" ry="15" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="5,5"/>
  </svg>
);

// Tongue Postures
export const TongueNeutral: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Neutral tongue at floor of mouth */}
    <ellipse cx="200" cy="300" rx="100" ry="25" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    <ellipse cx="200" cy="300" rx="80" ry="15" fill="#fca5a5" opacity="0.5"/>
  </svg>
);

export const TongueAlveolarTouch: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tongue tip touching alveolar ridge */}
    <path d="M120 180 Q150 220 200 280 Q250 220 280 180" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    <circle cx="200" cy="180" r="15" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    
    {/* Alveolar ridge indicator */}
    <line x1="150" y1="170" x2="250" y2="170" stroke="#0f172a" strokeWidth="3" strokeDasharray="5,5"/>
  </svg>
);

export const TongueAlveolarGroove: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tongue blade raised with central groove */}
    <path d="M100 200 Q150 180 200 170 Q250 180 300 200" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    <path d="M120 210 Q160 200 200 195 Q240 200 280 210" fill="#fca5a5" stroke="#dc2626" strokeWidth="1"/>
    
    {/* Central groove */}
    <path d="M200 170 L200 210" stroke="#dc2626" strokeWidth="3" strokeDasharray="3,3"/>
    
    {/* Airflow channel */}
    <path d="M200 160 L200 140" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrowhead)"/>
  </svg>
);

export const TongueInterdental: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tongue tip between teeth */}
    <path d="M150 250 Q180 220 200 200 Q220 220 250 250" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    <ellipse cx="200" cy="200" rx="20" ry="15" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    
    {/* Teeth gap */}
    <rect x="180" y="180" width="40" height="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
    <rect x="180" y="210" width="40" height="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
  </svg>
);

export const TongueRetroflexCurl: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tongue curled back toward palate */}
    <path d="M160 220 Q140 200 150 180 Q170 160 200 150 Q230 160 250 180 Q260 200 240 220" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    
    {/* Curl indication */}
    <path d="M200 150 Q180 140 170 160" stroke="#dc2626" strokeWidth="2" fill="none"/>
    
    {/* Hard palate area */}
    <path d="M120 140 Q200 120 280 140" stroke="#0f172a" strokeWidth="2" strokeDasharray="5,5"/>
  </svg>
);

export const TongueVelarBack: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tongue back elevated against soft palate */}
    <path d="M100 280 Q150 260 200 250 Q250 260 300 280" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    <ellipse cx="200" cy="230" rx="60" ry="30" fill="#f87171" stroke="#dc2626" strokeWidth="2"/>
    
    {/* Soft palate contact point */}
    <circle cx="200" cy="200" r="20" fill="#fca5a5" stroke="#dc2626" strokeWidth="2"/>
    
    {/* Soft palate */}
    <path d="M100 180 Q200 160 300 180" stroke="#0f172a" strokeWidth="2" strokeDasharray="5,5"/>
  </svg>
);

// Airflow & Acoustic Indicators
export const AirCentralStream: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "", isAnimated = false }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
    
    {/* Central airflow stream */}
    <path d="M50 200 L350 200" stroke="url(#streamGradient)" strokeWidth="8" strokeLinecap="round">
      {isAnimated && <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite"/>}
    </path>
    
    {/* Directional arrows */}
    <polygon points="320,190 350,200 320,210" fill="#38bdf8"/>
    <polygon points="280,190 310,200 280,210" fill="#38bdf8" opacity="0.7"/>
    <polygon points="240,190 270,200 240,210" fill="#38bdf8" opacity="0.5"/>
  </svg>
);

export const AirFrictionBurst: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "", isAnimated = false }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Turbulent friction burst */}
    <g stroke="#38bdf8" strokeWidth="2" fill="none">
      <path d="M150 180 Q180 170 200 180 Q220 170 250 180">
        {isAnimated && <animate attributeName="d" values="M150 180 Q180 170 200 180 Q220 170 250 180;M150 175 Q180 165 200 175 Q220 165 250 175;M150 180 Q180 170 200 180 Q220 170 250 180" dur="0.5s" repeatCount="indefinite"/>}
      </path>
      <path d="M160 200 Q190 190 210 200 Q230 190 260 200">
        {isAnimated && <animate attributeName="d" values="M160 200 Q190 190 210 200 Q230 190 260 200;M160 195 Q190 185 210 195 Q230 185 260 195;M160 200 Q190 190 210 200 Q230 190 260 200" dur="0.4s" repeatCount="indefinite"/>}
      </path>
      <path d="M155 220 Q185 210 205 220 Q225 210 255 220">
        {isAnimated && <animate attributeName="d" values="M155 220 Q185 210 205 220 Q225 210 255 220;M155 215 Q185 205 205 215 Q225 205 255 215;M155 220 Q185 210 205 220 Q225 210 255 220" dur="0.6s" repeatCount="indefinite"/>}
      </path>
    </g>
    
    {/* High frequency indicators */}
    <circle cx="200" cy="200" r="30" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.5">
      {isAnimated && <animate attributeName="r" values="30;40;30" dur="1s" repeatCount="indefinite"/>}
    </circle>
  </svg>
);

export const AirSoftContinuous: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "", isAnimated = false }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Gentle continuous airflow */}
    <path d="M100 200 Q200 190 300 200" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8,4" strokeLinecap="round" opacity="0.7">
      {isAnimated && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="2s" repeatCount="indefinite"/>}
    </path>
    
    {/* Soft wave patterns */}
    <path d="M120 210 Q160 200 200 210 Q240 200 280 210" stroke="#38bdf8" strokeWidth="2" opacity="0.5">
      {isAnimated && <animate attributeName="d" values="M120 210 Q160 200 200 210 Q240 200 280 210;M120 208 Q160 198 200 208 Q240 198 280 208;M120 210 Q160 200 200 210 Q240 200 280 210" dur="3s" repeatCount="indefinite"/>}
    </path>
  </svg>
);

export const AirPlosiveRelease: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "", isAnimated = false }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Explosive release wave */}
    <circle cx="200" cy="200" r="20" fill="#38bdf8" opacity="0.3">
      {isAnimated && <animate attributeName="r" values="20;80;20" dur="0.8s" repeatCount="indefinite"/>}
      {isAnimated && <animate attributeName="opacity" values="0.3;0;0.3" dur="0.8s" repeatCount="indefinite"/>}
    </circle>
    
    <circle cx="200" cy="200" r="40" fill="#38bdf8" opacity="0.2">
      {isAnimated && <animate attributeName="r" values="40;100;40" dur="0.8s" begin="0.2s" repeatCount="indefinite"/>}
      {isAnimated && <animate attributeName="opacity" values="0.2;0;0.2" dur="0.8s" begin="0.2s" repeatCount="indefinite"/>}
    </circle>
    
    {/* Directional burst */}
    <polygon points="200,150 190,180 210,180" fill="#38bdf8" opacity="0.6">
      {isAnimated && <animate attributeName="opacity" values="0.6;0;0.6" dur="0.5s" repeatCount="indefinite"/>}
    </polygon>
    <polygon points="200,250 190,220 210,220" fill="#38bdf8" opacity="0.6">
      {isAnimated && <animate attributeName="opacity" values="0.6;0;0.6" dur="0.5s" repeatCount="indefinite"/>}
    </polygon>
  </svg>
);

export const VocalVibrationGlow: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "", isAnimated = false }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="vibrationGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
      </radialGradient>
    </defs>
    
    {/* Vocal fold vibration glow */}
    <ellipse cx="200" cy="350" rx="60" ry="30" fill="url(#vibrationGlow)">
      {isAnimated && <animate attributeName="rx" values="60;70;60" dur="0.1s" repeatCount="indefinite"/>}
      {isAnimated && <animate attributeName="ry" values="30;35;30" dur="0.1s" repeatCount="indefinite"/>}
    </ellipse>
    
    {/* Sound waves */}
    <circle cx="200" cy="350" r="40" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.5">
      {isAnimated && <animate attributeName="r" values="40;60;40" dur="1s" repeatCount="indefinite"/>}
      {isAnimated && <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite"/>}
    </circle>
    
    <circle cx="200" cy="350" r="55" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.3">
      {isAnimated && <animate attributeName="r" values="55;75;55" dur="1s" begin="0.3s" repeatCount="indefinite"/>}
      {isAnimated && <animate attributeName="opacity" values="0.3;0;0.3" dur="1s" begin="0.3s" repeatCount="indefinite"/>}
    </circle>
  </svg>
);

// Teeth & Palate Guides
export const PalateTeethUpperLower: React.FC<AssetProps> = ({ className = "", opacity = 1, transform = "" }) => (
  <svg 
    viewBox="0 0 400 400" 
    className={className}
    style={{ opacity, transform }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hard palate */}
    <path d="M100 150 Q200 130 300 150" stroke="#0f172a" strokeWidth="3" fill="none"/>
    <text x="200" y="140" textAnchor="middle" fontSize="12" fill="#0f172a">Hard Palate</text>
    
    {/* Alveolar ridge */}
    <path d="M120 170 Q200 160 280 170" stroke="#0f172a" strokeWidth="2" strokeDasharray="5,5"/>
    <text x="200" y="185" textAnchor="middle" fontSize="10" fill="#0f172a">Alveolar Ridge</text>
    
    {/* Upper teeth */}
    <rect x="130" y="180" width="140" height="25" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    <text x="200" y="197" textAnchor="middle" fontSize="10" fill="#0f172a">Upper Teeth</text>
    
    {/* Lower teeth */}
    <rect x="130" y="220" width="140" height="25" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    <text x="200" y="237" textAnchor="middle" fontSize="10" fill="#0f172a">Lower Teeth</text>
    
    {/* Lip line */}
    <path d="M110 265 Q200 255 290 265" stroke="#fb7185" strokeWidth="3" strokeDasharray="8,4"/>
    <text x="200" y="280" textAnchor="middle" fontSize="10" fill="#dc2626">Lip Line</text>
  </svg>
);

// Asset Map
export const SPEECH_ASSETS: Record<string, React.FC<AssetProps>> = {
  // Mouth Base Shapes
  mouth_neutral: MouthNeutral,
  mouth_open_wide: MouthOpenWide,
  mouth_spread: MouthSpread,
  mouth_rounded: MouthRounded,
  mouth_bilabial_closed: MouthBilabialClosed,
  
  // Tongue Postures
  tongue_neutral: TongueNeutral,
  tongue_alveolar_touch: TongueAlveolarTouch,
  tongue_alveolar_groove: TongueAlveolarGroove,
  tongue_interdental: TongueInterdental,
  tongue_retroflex_curl: TongueRetroflexCurl,
  tongue_velar_back: TongueVelarBack,
  
  // Airflow & Acoustic Indicators
  air_central_stream: AirCentralStream,
  air_friction_burst: AirFrictionBurst,
  air_soft_continuous: AirSoftContinuous,
  air_plosive_release: AirPlosiveRelease,
  vocal_vibration_glow: VocalVibrationGlow,
  
  // Teeth & Palate Guides
  palate_teeth_upper_lower: PalateTeethUpperLower,
};