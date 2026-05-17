import React from 'react';
import { TickerPrice } from '../types';

interface PriceTickerProps {
  prices: Record<string, TickerPrice>;
}

const PriceTicker: React.FC<PriceTickerProps> = ({ prices }) => {
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  const priceEntries = Object.entries(prices);

  if (priceEntries.length === 0) {
    return (
      <div className="terminal-panel p-4 rounded-sm bg-ink border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-xs font-mono-data text-muted">Connecting to live market feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel p-4 rounded-sm bg-ink border border-white/5 overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
        <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Live Prices</span>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-1">
        {priceEntries.slice(0, 10).map(([symbol, data]) => (
          <div key={symbol} className="flex items-center gap-3 shrink-0 min-w-[160px]">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{symbol.replace('/USDT', '')}</span>
            <span className="text-xs font-mono-data text-secondary font-bold">${formatPrice(data.price)}</span>
            <span className={`text-[10px] font-mono-data font-bold ${data.change_pct_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.change_pct_24h >= 0 ? '+' : ''}{data.change_pct_24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceTicker;
