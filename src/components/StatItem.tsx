'use client';

import React from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: number | string;
  isRevenue?: boolean;
  isPercent?: boolean;
  growth?: number;
  className?: string;
}

export const StatItem = ({ 
  label, 
  value, 
  isRevenue = false, 
  isPercent = false,
  growth,
  className = ''
}: StatItemProps) => {
  const displayValue = typeof value === 'number' 
    ? isRevenue 
      ? formatCurrency(value)
      : isPercent
        ? formatPercent(value)
        : value.toLocaleString()
    : value;

  return (
    <div className={`flex justify-between items-center py-3 border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors px-2 rounded ${className}`}>
      <span className="text-sm text-gray-300 font-medium">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-gray-100 number-display">
          {displayValue}
        </span>
        {growth !== undefined && growth !== 0 && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded ${
            growth > 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {growth > 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
