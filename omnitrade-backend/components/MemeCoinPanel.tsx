import React, { useState, useEffect } from 'react';
import { MemeCoinAnalysis, SentimentData } from '../types';
import { backendService } from '../services/backendService';

const MemeCoinPanel: React.FC = () => {
  const [memeData, setMemeData] = useState<Record<string, MemeCoinAnalysis>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemeData = async () => {
      try {
        const data = await backendService.getMemeCoins();
        setMemeData(data);
      } catch (e) {
        console.error('Error fetching meme coin data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMemeData();
    const interval = setInterval(fetchMemeData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.001) return price.toFixed(6);
    return price.toFixed(10);
  };

  const getRiskColor = (risk: number): string => {
    if (risk < 30) return 'text-green-400';
    if (risk < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentColor = (trend: string): string => {
    if (trend === 'BULLISH') return 'text-green-400';
    if (trend === 'BEARISH') return 'text-red-400';
    return 'text-muted';
  };

  if (loading) {
    return (
      <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Meme Coin Scanner</span>
        </div>
        <div className="text-sm text-muted py-4">Loading meme coin analysis from DexScreener & CoinGecko...</div>
      </div>
    );
  }

  const entries = Object.entries(memeData);

  return (
    <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink border-l-2 border-yellow-500">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Meme Coin Scanner</span>
        <span className="text-xs font-mono-data text-yellow-400 font-bold">LIVE</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-muted py-4">No meme coin data available. Ensure backend is connected.</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {entries.map(([symbol, data]) => (
            <div key={symbol} className="flex justify-between items-center py-3 px-3 border-b border-white/5 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-primary tracking-wider">{symbol.replace('/USDT', '')}</span>
                {data.sentiment && (
                  <span className={`text-[10px] font-bold uppercase ${getSentimentColor(data.sentiment.sentiment_trend)}`}>
                    {data.sentiment.sentiment_trend}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                {data.price_usd > 0 && (
                  <span className="text-xs font-mono-data text-secondary">${formatPrice(data.price_usd)}</span>
                )}
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-mono-data font-bold ${getRiskColor(data.risk_score)}`}>
                    Risk: {data.risk_score.toFixed(0)}
                  </span>
                  {data.sentiment && (
                    <span className="text-[10px] text-muted">
                      {data.sentiment.mention_count_24h} mentions
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemeCoinPanel;
