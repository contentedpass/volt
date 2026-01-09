import { GoogleGenAI } from "@google/genai";
import { CircuitState, ConnectionType } from "../types";

const initGenAI = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const explainCircuit = async (state: CircuitState): Promise<string> => {
  const ai = initGenAI();
  if (!ai) {
    return "API 키가 설정되지 않아 AI 설명을 불러올 수 없습니다.";
  }

  const { batteryCount, connectionType, isSwitchClosed } = state;

  if (!isSwitchClosed) {
    return "스위치가 열려 있어 전류가 흐르지 않습니다. 스위치를 닫아보세요!";
  }

  const connectionText = connectionType === ConnectionType.SERIES ? "직렬(Series)" : "병렬(Parallel)";
  
  const prompt = `
    당신은 초등학교 과학 선생님입니다. 학생이 전구와 전지가 연결된 회로 실험을 하고 있습니다.
    현재 회로 상태:
    - 전지 개수: ${batteryCount}개
    - 연결 방식: ${connectionText}
    - 스위치: 닫힘 (전류 흐름)

    이 상황에서 전구의 밝기가 어떻게 되는지, 그리고 왜 그런지 초등학생이 이해하기 쉽게 설명해주세요.
    직렬 연결일 때 전압이 더해지는 원리와 병렬 연결일 때 전압이 유지되는 원리를 비유를 들어 설명하면 좋습니다.
    답변은 300자 이내로 친절하게 해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "설명을 생성하는 도중 오류가 발생했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 선생님이 잠시 쉬고 있어요. 다시 시도해주세요.";
  }
};