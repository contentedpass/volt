import React, { useState, useEffect, useMemo } from 'react';
import { CircuitDiagram } from './components/CircuitDiagram';
import { CircuitState, ConnectionType, SimulationStats } from './types';
import { explainCircuit } from './services/geminiService';
import { 
  Zap, 
  Battery, 
  Lightbulb, 
  ToggleLeft, 
  ToggleRight, 
  Settings2,
  Bot
} from 'lucide-react';

export default function App() {
  // State
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
    const RESISTANCE_BULB = 10; // Ohms

    if (!isSwitchClosed) {
      return { voltage: 0, current: 0, brightness: 0 };
    }

    let voltage = 0;
    if (connectionType === ConnectionType.SERIES) {
      voltage = batteryCount * VOLTAGE_PER_CELL;
    } else {
      // Parallel: Voltage stays same (assuming ideal batteries)
      voltage = VOLTAGE_PER_CELL; 
    }

    const current = voltage / RESISTANCE_BULB; // I = V / R
    
    // Normalize brightness for visuals (Max expected ~4.5V)
    // 1.5V = 0.33 scale, 3.0V = 0.66 scale, 4.5V = 1.0 scale
    // Let's make 1.5V visible but dim, 4.5V very bright.
    const maxVoltage = 4.5;
    const brightness = Math.min(1.5, voltage / 3.0); // 4.5V -> 1.5 brightness factor

    return { voltage, current, brightness };
  }, [circuitState]);

  // Handlers
  const toggleSwitch = () => {
    setCircuitState(prev => ({ ...prev, isSwitchClosed: !prev.isSwitchClosed }));
  };

  const setBatteries = (count: number) => {
    setCircuitState(prev => ({ ...prev, batteryCount: count }));
  };

  const setConnection = (type: ConnectionType) => {
    setCircuitState(prev => ({ ...prev, connectionType: type }));
  };

  const handleAskAI = async () => {
    setIsLoadingAi(true);
    setAiExplanation("");
    const explanation = await explainCircuit(circuitState);
    setAiExplanation(explanation);
    setIsLoadingAi(false);
  };

  // Clear AI explanation when state changes to avoid stale info
  useEffect(() => {
    setAiExplanation("");
  }, [circuitState]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Lightbulb className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          전구 밝기 실험실
        </h1>
        <p className="text-slate-600 mt-2">전지의 연결 방법에 따른 전구의 밝기 변화를 관찰해보세요.</p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Circuit Display */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 aspect-[4/3] relative">
            <CircuitDiagram 
              state={circuitState} 
              voltage={stats.voltage} 
              current={stats.current}
              brightness={stats.brightness}
            />
            
            {/* Overlay Stats */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-slate-200 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-700">전압 (Voltage):</span>
                <span className="font-mono text-blue-600">{stats.voltage.toFixed(1)} V</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">전류 (Current):</span>
                <span className="font-mono text-red-600">{stats.current.toFixed(2)} A</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Controls & AI */}
        <section className="flex flex-col gap-6">
          
          {/* Controls Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              실험 설정
            </h2>

            {/* Switch Control */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-slate-600 mb-2">스위치 (Switch)</span>
              <button
                onClick={toggleSwitch}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  circuitState.isSwitchClosed 
                    ? 'bg-green-500 text-white shadow-green-200 shadow-md hover:bg-green-600' 
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {circuitState.isSwitchClosed ? (
                  <><ToggleRight className="w-6 h-6" /> ON (닫힘)</>
                ) : (
                  <><ToggleLeft className="w-6 h-6" /> OFF (열림)</>
                )}
              </button>
            </div>

            {/* Battery Count */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-slate-600 mb-2">전지 개수 (Battery Count)</span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBatteries(num)}
                    className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                      circuitState.batteryCount === num
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {num}개
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Type */}
            <div className="mb-4">
              <span className="block text-sm font-semibold text-slate-600 mb-2">연결 방법 (Connection)</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConnection(ConnectionType.SERIES)}
                  className={`py-2 px-3 rounded-lg border-2 font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                    circuitState.connectionType === ConnectionType.SERIES
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-4 border border-current rounded-sm"></div>
                    <div className="w-3 h-4 border border-current rounded-sm"></div>
                  </div>
                  직렬 (Series)
                </button>
                <button
                  onClick={() => setConnection(ConnectionType.PARALLEL)}
                  className={`py-2 px-3 rounded-lg border-2 font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                    circuitState.connectionType === ConnectionType.PARALLEL
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-2 border border-current rounded-sm"></div>
                    <div className="w-4 h-2 border border-current rounded-sm"></div>
                  </div>
                  병렬 (Parallel)
                </button>
              </div>
            </div>
          </div>

          {/* AI Explanation Card */}
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100">
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI 선생님
            </h2>
            
            <div className="mb-4 min-h-[100px] text-sm text-slate-700 leading-relaxed bg-white/50 p-4 rounded-xl border border-purple-50">
              {aiExplanation ? (
                <p>{aiExplanation}</p>
              ) : (
                <p className="text-slate-400 italic">
                  "현재 회로 상태에 대해 질문하면 AI 선생님이 설명을 해줍니다."
                </p>
              )}
            </div>

            <button
              onClick={handleAskAI}
              disabled={isLoadingAi}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingAi ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  생각하는 중...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  지금 상태 설명 듣기
                </>
              )}
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}