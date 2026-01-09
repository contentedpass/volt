'use server'

import { GoogleGenAI } from "@google/genai";
import { CircuitState, ConnectionType } from "../types";

export async function getCircuitExplanation(state: CircuitState): Promise<string> {
  // API key must be strictly obtained from process.env.API_KEY on the server
  if (!process.env.API_KEY) {
    return "API 키 설정을 확인해주세요 (Server Side).";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { batteryCount, connectionType, isSwitchClosed } = state;

  if (!isSwitchClosed) {
    return "💡 스위치가 열려 있어요! 스위치를 닫아 전구에 불을 켜보세요.";
  }

  const connectionText = connectionType === ConnectionType.SERIES ? "직렬(Series)" : "병렬(Parallel)";
  
  const prompt = `
    현재 회로 상태:
    - 전지 개수: ${batteryCount}개
    - 연결 방식: ${connectionText} 연결
    
    이 실험 조건에서 전구의 밝기가 어떻게 나타나는지(예: 기준보다 밝음, 어두움, 같음 등), 그리고 왜 그런지 설명해주세요.
    직렬 연결은 전지가 힘을 합쳐 전압이 높아지는 원리, 병렬 연결은 전압은 같지만 전지가 오래가는 원리 등을 
    초등학생이 이해하기 쉽게 물이 흐르는 수도관이나 힘을 합치는 줄다리기 등의 비유를 들어 설명해주세요.
    말투는 친절한 과학 선생님처럼 해주세요.
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
}