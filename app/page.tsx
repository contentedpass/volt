'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CircuitDiagram } from '../components/CircuitDiagram';
import { CircuitState, ConnectionType, SimulationStats } from '../types';
import { getCircuitExplanation } from './actions';
import { 
  Zap, 
  Lightbulb, 
  ToggleLeft, 
  ToggleRight, 
  Settings2,
  Bot,
  RotateCcw
} from 'lucide-react';

export default function Home() {
  const [circuitState, setCircuitState] = useState<CircuitState>({
    batteryCount: 1,
    connectionType: ConnectionType.SERIES,
    isSwitchClosed: false,
  });

  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Physics Calculation
  const stats: SimulationStats = useMemo(() => {
    const { batteryCount, connectionType, isSwitchClosed } = circuitState;
    const VOLTAGE_PER_CELL = 1.5;
    const RESISTANCE_BULB = 10; 

    if (!isSwitchClosed) {
      return { voltage: 0, current: 0, brightness: 0 };
    }

    let voltage = 0;
    if (connectionType === ConnectionType.SERIES) {
      voltage = batteryCount * VOLTAGE_PER_CELL;
    } else {
      voltage = VOLTAGE_PER_CELL; 
    }

    const current = voltage / RESISTANCE_BULB; 
    const brightness = Math.min(1.5, voltage / 3.0); 

    return { voltage, current, brightness };
  }, [circuitState]);

  const toggleSwitch = () => {
    setCircuitState(prev => ({ ...prev, isSwitchClosed: !prev.isSwitchClosed }));
  };

  const setBatteries = (count: number) => {
    setCircuitState(prev => ({ ...prev, batteryCount: count }));
  };

  const setConnection = (type: ConnectionType) => {
    setCircuitState(prev => ({ ...prev, connectionType: type }));
  };

  const resetCircuit = () => {
    setCircuitState({
      batteryCount: 1,
      connectionType: ConnectionType.SERIES,
      isSwitchClosed: false,
    });
    setAiExplanation("");
  };

  // Server Action call
  const handleAskAI = async () => {
    setIsLoadingAi(true);
    setAiExplanation("");
    try {
      const explanation = await getCircuitExplanation(circuitState);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation("오류가 발생했습니다.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    setAiExplanation("");
  }, [circuitState]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4 font-sans text-slate-900">
      <header className="mb-8 text-center max-w-2xl w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 flex items-center justify-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 animate-pulse-slow" />
          전구 밝기 실험실
        </h1>
        <p className="text-slate-600">전지의 연결 방법과 개수를 바꾸며 전구의 밝기를 관찰해보세요.</p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Circuit Display (Responsive Aspect Ratio) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white p-2 md:p-6 rounded-3xl shadow-xl border border-slate-200 w-full relative overflow-hidden">
            <div className="aspect-[4/3] md:aspect-video w-full h-full">
                <CircuitDiagram 
                state={circuitState} 
                voltage={stats.voltage} 
                current={stats.current}
                brightness={stats.brightness}
                />
            </div>
            
            {/* Overlay Stats */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-lg border border-slate-100 text-sm md:text-base ring-1 ring-slate-900/5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-slate-600 w-24">전압 (Voltage)</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{stats.voltage.toFixed(1)} V</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-600 w-24">전류 (Current)</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{stats.current.toFixed(2)} A</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Controls & AI */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Controls Card */}
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-slate-600" />
                실험 설정
              </h2>
              <button 
                onClick={resetCircuit}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 초기화
              </button>
            </div>

            {/* Switch Control */}
            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">스위치 (Switch)</span>
              <button
                onClick={toggleSwitch}
                className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 transform active:scale-95 ${
                  circuitState.isSwitchClosed 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600' 
                    : 'bg-white text-slate-500 border-2 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {circuitState.isSwitchClosed ? (
                  <><ToggleRight className="w-8 h-8" /> 닫힘 (ON)</>
                ) : (
                  <><ToggleLeft className="w-8 h-8" /> 열림 (OFF)</>
                )}
              </button>
            </div>

            {/* Battery Count */}
            <div className="mb-6">
              <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">전지 개수</span>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBatteries(num)}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-lg transition-all ${
                      circuitState.batteryCount === num
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-md'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Type */}
            <div className="mb-2">
              <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">연결 방법</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConnection(ConnectionType.SERIES)}
                  className={`py-3 px-3 rounded-xl border-2 font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                    circuitState.connectionType === ConnectionType.SERIES
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  <div className="flex gap-0.5 opacity-80">
                    <div className="w-2.5 h-3.5 border border-current rounded-[1px]"></div>
                    <div className="w-2.5 h-3.5 border border-current rounded-[1px]"></div>
                  </div>
                  직렬 (Series)
                </button>
                <button
                  onClick={() => setConnection(ConnectionType.PARALLEL)}
                  className={`py-3 px-3 rounded-xl border-2 font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                    circuitState.connectionType === ConnectionType.PARALLEL
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 opacity-80">
                    <div className="w-3.5 h-2 border border-current rounded-[1px]"></div>
                    <div className="w-3.5 h-2 border border-current rounded-[1px]"></div>
                  </div>
                  병렬 (Parallel)
                </button>
              </div>
            </div>
          </div>

          {/* AI Explanation Card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-1 rounded-3xl shadow-xl">
            <div className="bg-white rounded-[22px] p-5 h-full">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Bot className="w-6 h-6 text-indigo-600" />
                AI 과학 선생님
              </h2>
              
              <div className="mb-4 min-h-[120px] text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {aiExplanation ? (
                  <p className="animate-in fade-in slide-in-from-bottom-2 duration-500">{aiExplanation}</p>
                ) : (
                  <p className="text-slate-400 italic text-center py-4">
                    "현재 회로 상태에 대해 궁금한가요?<br/>아래 버튼을 눌러보세요!"
                  </p>
                )}
              </div>

              <button
                onClick={handleAskAI}
                disabled={isLoadingAi}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
              >
                {isLoadingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    생각하는 중...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    설명 듣기
                  </>
                )}
              </button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}