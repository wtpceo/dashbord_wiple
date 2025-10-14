'use client';

import React, { useState } from 'react';
import { ChannelData } from '@/types/dashboard';
import { StatItem } from './StatItem';

interface ExpandableCardProps {
  title: string;
  icon: string;
  totalValue: number;
  channelData: ChannelData[];
  isRevenue?: boolean;
  subtitle?: string;
}

export const ExpandableCard = ({ 
  title, 
  icon, 
  totalValue, 
  channelData, 
  isRevenue = false,
  subtitle
}: ExpandableCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card-elevated rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-800/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100 mb-1">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400 number-display">
                {isRevenue ? `${(totalValue / 100000000).toFixed(1)}억` : totalValue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {isRevenue ? '매출' : '개수'}
              </div>
            </div>
            <div className={`w-8 h-8 flex items-center justify-center border border-gray-600 rounded bg-gray-800/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg 
                className="w-4 h-4 text-gray-400"
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-700/50 p-6 bg-gray-900/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <h4 className="text-sm font-semibold text-gray-300">
                매체별 상세
              </h4>
            </div>
            {channelData.map((item, index) => (
              <StatItem 
                key={index}
                label={item.channel}
                value={item.value}
                isRevenue={isRevenue}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
