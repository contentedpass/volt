import { GoogleGenAI } from "@google/genai";
import { CircuitState, ConnectionType } from "../types";

const initGenAI = () => {
  // API key must be strictly obtained from process.env.API_KEY
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const explainCircuit = async (state: CircuitState): Promise<string> => {
  const ai = initGenAI();
  if (!ai) {
    return "API 키가 설정되지 않았습니다. 환경 변수(API_KEY) 설정을 확인해주세요.";
  }

  const { batteryCount, connectionType, isSwitchClosed } = state;

  if (!isSwitchClosed) {
    return "스위치가 열려 있어 전류가 흐르지 않습니다. 스위치를 닫아 전구에 불을 켜보세요! 전구가 켜져야 밝기를 관찰할 수 있습니다.";
  }

  const connectionText = connectionType === ConnectionType.SERIES ? "직렬(Series)" : "병렬(Parallel)";
  
  // Prompt optimized for elementary school science explanation
  const prompt = `
    현재 회로 상태:
    - 전지 개수: ${batteryCount}개
    - 연결 방식: ${connectionText} 연결
    
    이 실험 조건에서 전구의 밝기가 어떻게 나타나는지(예: 기준보다 밝음, 어두움, 같음 등), 그리고 왜 그런지 설명해주세요.
    직렬 연결은 전지가 힘을 합쳐 전압이 높아지는 원리, 병렬 연결은 전압은 같지만 전지가 오래가는 원리 등을 
    물이 흐르는 수도관이나 힘을 합치는 줄다리기 등의 쉬운 비유를 들어 설명해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "당신은 아이들을 좋아하는 친절한 초등학교 과학 선생님입니다. 어려운 물리 용어 대신 쉬운 비유를 사용하여 설명해주세요. 답변은 3~4문장으로 간결하고 명확하게, 격려하는 어조로 해주세요.",
        temperature: 0.7,
      }
    });
    return response.text || "설명을 불러올 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 선생님과 연결하는데 문제가 생겼어요. 잠시 후 다시 시도해주세요.";
  }
};