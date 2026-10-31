import React from 'react';
import { MinimapDot } from '../game/engine';
import { TrackData } from '../game/tracks/types';

interface MinimapProps {
  track: TrackData;
  dots: MinimapDot[];
}

export const Minimap: React.FC<MinimapProps> = ({ track, dots }) => {
  const { minX, maxX, minY, maxY } = track.bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const pad = 120;

  const pathData = React.useMemo(() => {
    if (track.spline.length === 0) return '';
    return (
      track.spline
        .filter((_, idx) => idx % 3 === 0)
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${Math.round(pt.x)} ${Math.round(pt.y)}`)
        .join(' ') + ' Z'
    );
  }, [track]);

  const startCp = track.checkpoints[0];

  return (
    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] p-2 shadow-xl pointer-events-none">
      <svg
        viewBox={`${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`}
        className="w-full h-full overflow-visible"
      >
        {/* Track outline */}
        <path
          d={pathData}
          fill="none"
          stroke="#334155"
          strokeWidth={Math.max(width, height) * 0.045}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={pathData}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={Math.max(width, height) * 0.018}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Start line marker */}
        {startCp && (
          <circle
            cx={startCp.x}
            cy={startCp.y}
            r={Math.max(width, height) * 0.025}
            fill="#ffffff"
          />
        )}

        {/* 5 Racer Dots (AI first, Player on top) */}
        {dots
          .slice()
          .sort((a, b) => (a.isPlayer ? 1 : b.isPlayer ? -1 : 0))
          .map((d) => (
            <g key={d.id}>
              {d.isPlayer && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={Math.max(width, height) * 0.065}
                  fill="rgba(255, 51, 102, 0.35)"
                />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={
                  d.isPlayer
                    ? Math.max(width, height) * 0.042
                    : Math.max(width, height) * 0.032
                }
                fill={d.isPlayer ? '#ff3366' : d.color}
                stroke="#ffffff"
                strokeWidth={Math.max(width, height) * 0.01}
              />
            </g>
          ))}
      </svg>
    </div>
  );
};
