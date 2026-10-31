import React from 'react';

interface StatBarProps {
  label: string;
  value: number; // 1..10
  max?: number;
  color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  max = 10,
  color = '#00f0ff',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono font-bold text-white">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#090b10] border border-[#232a3d] overflow-hidden p-0.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
};
