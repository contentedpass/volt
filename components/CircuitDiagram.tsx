import React, { useMemo } from 'react';
import { CircuitState, ConnectionType } from '../types';
import { Bulb } from './Bulb';

interface CircuitDiagramProps {
  state: CircuitState;
  voltage: number;
  current: number;
  brightness: number;
}

const Battery: React.FC<{ x: number; y: number; label?: string }> = ({ x, y, label }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Body */}
    <rect x="-25" y="-15" width="50" height="30" rx="3" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    {/* Positive Terminal */}
    <rect x="25" y="-8" width="6" height="16" rx="1" fill="#9ca3af" />
    {/* Negative Symbol */}
    <text x="-18" y="5" fontSize="16" fill="white" fontWeight="bold">-</text>
    {/* Positive Symbol */}
    <text x="12" y="5" fontSize="16" fill="white" fontWeight="bold">+</text>
    {/* Label */}
    {label && <text x="0" y="5" fontSize="12" fill="white" textAnchor="middle">{label}</text>}
  </g>
);

export const CircuitDiagram: React.FC<CircuitDiagramProps> = ({ state, voltage, current, brightness }) => {
  const { batteryCount, connectionType, isSwitchClosed } = state;

  // Animation speed: duration decreases as current increases
  // Base duration 2s, divided by current. If current is 0, duration is infinity.
  // We use a small factor to make visuals look nice.
  // Standard 1.5V current (1 battery) -> let's say "speed 1"
  // 3.0V (2 series) -> "speed 2"
  // 4.5V (3 series) -> "speed 3"
  // Parallel -> "speed 1"
  
  // Current in simulation logic: 1 battery = 1.0 (relative).
  // animation-duration = base / current.
  const animationDuration = current > 0 ? `${1 / current}s` : '0s';
  const isFlowing = isSwitchClosed && current > 0;

  // Render Batteries based on config
  const renderBatteries = () => {
    const batteries: React.ReactElement[] = [];
    const batteryWidth = 60;
    
    if (connectionType === ConnectionType.SERIES) {
      // Horizontal Line
      const totalWidth = batteryCount * batteryWidth;
      const startX = 200 - (totalWidth / 2) + (batteryWidth / 2);
      
      for (let i = 0; i < batteryCount; i++) {
        batteries.push(
          <Battery key={i} x={startX + i * batteryWidth} y={250} label="1.5V" />
        );
      }
    } else {
      // Parallel: Vertical Stack
      const startY = 250 - ((batteryCount - 1) * 40) / 2;
      for (let i = 0; i < batteryCount; i++) {
        batteries.push(
          <Battery key={i} x={200} y={startY + i * 40} label="1.5V" />
        );
      }
    }
    return batteries;
  };

  // Generate wire paths dynamically
  const wires = useMemo(() => {
    const paths: React.ReactElement[] = [];
    const mainStroke = "#475569";
    const flowColor = "#fbbf24"; // Electrons/Current color
    
    // Wire drawing helper
    const drawWire = (d: string, key: string) => (
      <g key={key}>
        {/* Base Wire */}
        <path d={d} fill="none" stroke={mainStroke} strokeWidth="4" />
        {/* Current Flow Animation */}
        {isFlowing && (
          <path 
            d={d} 
            fill="none" 
            stroke={flowColor} 
            strokeWidth="2" 
            strokeDasharray="10 10" 
            className="animate-flow"
            style={{ animationDuration }}
          />
        )}
      </g>
    );

    // 1. Bulb (Top 200,80) to Switch (Left side, say 50, 150)
    // 2. Switch to Battery Negative Area
    // 3. Battery Positive Area to Bulb
    
    // Adjust battery connection points based on configuration
    let batNegX, batNegY, batPosX, batPosY;

    if (connectionType === ConnectionType.SERIES) {
      const widthPerBat = 60;
      const totalW = batteryCount * widthPerBat;
      batNegX = 200 - (totalW / 2); 
      batPosX = 200 + (totalW / 2);
      batNegY = 250;
      batPosY = 250;

      // Wires connecting batteries internally in series visually (already touching, but logically distinct)
      // We assume they touch directly.
    } else {
      // Parallel
      // Bus bars
      const topBatY = 250 - ((batteryCount - 1) * 40) / 2;
      const botBatY = 250 + ((batteryCount - 1) * 40) / 2;
      
      batNegX = 160; // Left bus bar x
      batPosX = 240; // Right bus bar x
      batNegY = 250; // Middle
      batPosY = 250; // Middle

      // Draw vertical bus bars
      paths.push(drawWire(`M ${batNegX} ${topBatY} L ${batNegX} ${botBatY}`, 'neg-bus'));
      paths.push(drawWire(`M ${batPosX} ${topBatY} L ${batPosX} ${botBatY}`, 'pos-bus'));

      // Connect each battery to bus bars
      for (let i = 0; i < batteryCount; i++) {
        const y = topBatY + i * 40;
        paths.push(drawWire(`M ${batNegX} ${y} L 175 ${y}`, `par-left-${i}`)); // 175 is battery left edge approx
        paths.push(drawWire(`M 225 ${y} L ${batPosX} ${y}`, `par-right-${i}`)); // 225 is battery right edge approx
      }
    }

    // Main Loop Wires
    
    // Left Side: Bulb -> Switch -> Battery Negative
    // Bulb connection left: 200, 25 (socket) -> offset slightly? Let's say bulb connects at top.
    // Actually bulb has two terminals. Let's simplify: 
    // Terminal 1: (190, 80) roughly (side of base)
    // Terminal 2: (200, 105) (bottom of base)
    
    // Let's connect "Positive" (Right) to Bottom Tip (200, 105)
    // Let's connect "Negative" (Left) to Side Casing (190, 95)
    
    const bulbNeg = { x: 190, y: 95 };
    const bulbPos = { x: 200, y: 105 }; // actually tip is usually pos or neg, doesn't matter for DC bulb really
    
    // Wire 1: Battery Positive -> Bulb Tip
    paths.push(drawWire(`M ${batPosX} ${batPosY} L ${350} ${batPosY} L ${350} 80 L ${bulbPos.x} ${bulbPos.y}`, 'main-pos'));

    // Wire 2: Bulb Side -> Switch
    const switchLeft = { x: 50, y: 150 };
    const switchRight = { x: 100, y: 150 }; // Visual gap
    
    paths.push(drawWire(`M ${bulbNeg.x} ${bulbNeg.y} L 50 95 L ${switchLeft.x} ${switchLeft.y}`, 'bulb-switch'));

    // Wire 3: Switch -> Battery Negative
    // Switch arm logic is separate visual
    paths.push(drawWire(`M ${switchRight.x} ${switchRight.y} L ${switchRight.x} ${batNegY} L ${batNegX} ${batNegY}`, 'switch-bat'));

    return paths;
  }, [batteryCount, connectionType, isSwitchClosed, isFlowing, animationDuration]);

  return (
    <svg viewBox="0 0 400 350" className="w-full h-full bg-slate-100 rounded-xl border border-slate-300 shadow-inner">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Wires */}
      {wires}

      {/* Switch Visual */}
      <g transform="translate(50, 150)">
        <circle cx="0" cy="0" r="5" fill="#333" />
        <circle cx="50" cy="0" r="5" fill="#333" />
        {/* Switch Arm */}
        <line 
          x1="0" y1="0" 
          x2={isSwitchClosed ? "50" : "45"} 
          y2={isSwitchClosed ? "0" : "-25"} 
          stroke="#333" 
          strokeWidth="4" 
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </g>

      {/* Bulb */}
      <Bulb brightness={brightness} isOn={isFlowing} />

      {/* Batteries */}
      {renderBatteries()}
    </svg>
  );
};