
import { GoogleGenAI } from "@google/genai";
import { ScannerState, MarketPhase, TrendState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMarketAdvice(state: ScannerState): Promise<string> {
  try {
    const prompt = `
      Acting as a Senior Quant Trader, analyze the current market state and provide a 2-sentence tactical advice.
      Market Data:
      - Volatility: ${state.volatility}
      - Trend: ${state.trend}
      - Phase: ${state.phase}
      - Session: ${state.clock} (${state.cycle})
      - Uncertainty Level: ${state.uncertainty}
      
      Respond with specific bot recommendations based on these conditions. Keep it professional and concise.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "Unable to retrieve AI analysis at this time.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Connection to AI Logic Engine lost. Monitoring manual telemetry.";
  }
}
