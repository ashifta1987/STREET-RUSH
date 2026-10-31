import React from 'react';

interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  selected = false,
  accentColor = '#ff3366',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      style={
        selected
          ? {
              borderColor: accentColor,
              boxShadow: `0 0 24px -4px ${accentColor}55`,
            }
          : undefined
      }
      className={`rounded-2xl bg-[#121621]/95 border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-500' : ''
      } ${
        selected ? 'border-2 bg-[#171d2c]' : 'border-[#232a3d]'
      } ${className}`}
    >
      {children}
    </div>
  );
};
