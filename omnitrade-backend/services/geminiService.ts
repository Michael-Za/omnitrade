
import { ScannerState, MarketPhase, TrendState } from "../types";

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    try {
      // Dynamic import to avoid build errors if @google/genai is not installed
      const { GoogleGenAI } = require("@google/genai");
      const key = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
      if (!key || key === "undefined" || key === "") {
        return null;
      }
      aiInstance = new GoogleGenAI({ apiKey: key });
    } catch {
      return null;
    }
  }
  return aiInstance;
}

// Fallback advice generator when AI is not available
function generateFallbackAdvice(state: ScannerState): string {
  const trendMap = { UP: 'bullish', DOWN: 'bearish', NEUTRAL: 'sideways' };
  const phaseMap = { ACCUMULATION: 'accumulation', EXPANSION: 'expansion', DISTRIBUTION: 'distribution', RESET: 'reset' };

  const trend = trendMap[state.trend as keyof typeof trendMap] || 'sideways';
  const phase = phaseMap[state.phase as keyof typeof phaseMap] || 'neutral';
  const vol = state.volatility === 'HIGH' ? 'elevated' : 'compressed';

  let advice = `Market regime: ${trend} momentum with ${vol} volatility in ${phase} phase. `;

  if (state.trend === 'UP' && state.volatility === 'LOW') {
    advice += 'VWAP Mean Reversion and Trend Pullback strategies aligned. Consider accumulation on dips.';
  } else if (state.trend === 'UP' && state.volatility === 'HIGH') {
    advice += 'Momentum strategies favored but risk elevated. Reduce position sizes and tighten stops.';
  } else if (state.trend === 'DOWN' && state.volatility === 'HIGH') {
    advice += 'Defensive posture recommended. Guardian threshold monitoring active. Await stabilization signals.';
  } else if (state.trend === 'NEUTRAL' && state.volatility === 'LOW') {
    advice += 'Range-bound conditions. Range Scalper and Mean Reversion strategies optimal. Watch for BB squeeze breakout.';
  } else {
    advice += 'Session alignment analysis suggests monitoring for regime change signals.';
  }

  if (state.uncertainty === 'HIGH' || state.uncertainty === 'CRITICAL') {
    advice += ' Elevated uncertainty detected - governance mode may restrict active strategies.';
  }

  return advice;
}

export async function getMarketAdvice(state: ScannerState): Promise<string> {
  const ai = getAI();

  if (!ai) {
    return generateFallbackAdvice(state);
  }

  try {
    const prompt = `
      Acting as a Senior Quant Trader, analyze the current market state and provide a 2-sentence tactical advice.
      Market Data (REAL-TIME):
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

    return response.text || generateFallbackAdvice(state);
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return generateFallbackAdvice(state);
  }
}
