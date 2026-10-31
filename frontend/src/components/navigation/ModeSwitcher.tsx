'use client';

import React from 'react';
import { useModeStore } from '@/store/useModeStore';
import { ShoppingBag, Tag } from 'lucide-react';

export const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useModeStore();

  return (
    <div
      className="inline-flex items-center p-1 rounded-full bg-[#edeae2] border border-[#e2ded6] shadow-inner"
      role="group"
      aria-label="Marketplace Mode Switcher"
    >
      <button
        type="button"
        onClick={() => setMode('buy')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
          mode === 'buy'
            ? 'bg-white text-[#1a3a2a] shadow-sm'
            : 'text-[#5c645d] hover:text-[#1a3a2a]'
        }`}
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Buy Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('sell')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
          mode === 'sell'
            ? 'bg-white text-[#1a3a2a] shadow-sm'
            : 'text-[#5c645d] hover:text-[#1a3a2a]'
        }`}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>Sell Mode</span>
      </button>
    </div>
  );
};
