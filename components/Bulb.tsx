import React from 'react';

interface BulbProps {
  brightness: number; 
  isOn: boolean;
}

export const Bulb: React.FC<BulbProps> = ({ brightness, isOn }) => {
  const effectiveBrightness = isOn ? Math.max(0.1, brightness) : 0;
  
  const getFilamentColor = (b: number) => {
    if (!isOn) return "#555";
    if (b < 0.5) return `rgb(255, ${100 + b * 200}, 0)`; 
    if (b < 1.0) return `rgb(255, 255, ${b * 100})`; 
    return "#FFF"; 
  };

  const glowOpacity = isOn ? Math.min(0.8, brightness * 0.6) : 0;
  const glowRadius = isOn ? 15 + brightness * 40 : 0;

  return (
    <g transform="translate(200, 80)">
      <defs>
        <filter id="blurMe">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>

      {/* Glow Effect */}
      {isOn && (
        <circle cx="0" cy="0" r={glowRadius} fill="gold" fillOpacity={glowOpacity} filter="url(#blurMe)" />
      )}
      
      {/* Glass Bulb */}
      <path
        d="M -15 -20 A 20 20 0 1 1 15 -20 L 10 10 L -10 10 Z"
        fill={isOn ? `rgba(255, 255, 200, ${Math.min(0.9, 0.2 + brightness * 0.5)})` : "rgba(255,255,255,0.2)"}
        stroke="#888"
        strokeWidth="1"
      />
      
      {/* Base */}
      <rect x="-10" y="10" width="20" height="10" fill="#AAA" rx="2" />
      <rect x="-8" y="20" width="16" height="5" fill="#555" rx="1" />
      
      {/* Filament */}
      <path
        d="M -5 10 L -5 -5 L 0 -10 L 5 -5 L 5 10"
        fill="none"
        stroke={getFilamentColor(brightness)}
        strokeWidth={isOn ? 2 : 1}
      />
      
      {/* Connection Points */}
      <circle cx="0" cy="25" r="2" fill="#333" />
    </g>
  );
};