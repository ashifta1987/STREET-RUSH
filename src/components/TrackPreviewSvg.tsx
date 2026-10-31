import React from 'react';
import { TRACKS_BY_ID } from '../game/tracks';
import { TrackMetadata } from '../game/content';

interface TrackPreviewSvgProps {
  trackId: TrackMetadata['id'];
  accentColor?: string;
}

export const TrackPreviewSvg: React.FC<TrackPreviewSvgProps> = ({
  trackId,
  accentColor = '#00f0ff',
}) => {
  const track = TRACKS_BY_ID[trackId];
  const { minX, maxX, minY, maxY } = track.bounds;
  const w = maxX - minX;
  const h = maxY - minY;
  const pad = 80;

  const d = React.useMemo(() => {
    return (
      track.spline
        .filter((_, idx) => idx % 3 === 0)
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${Math.round(p.x)} ${Math.round(p.y)}`)
        .join(' ') + ' Z'
    );
  }, [track]);

  const start = track.checkpoints[0];

  return (
    <svg
      viewBox={`${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`}
      className="w-full h-28"
    >
      <path
        d={d}
        fill="none"
        stroke="#1e293b"
        strokeWidth={Math.max(w, h) * 0.06}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={accentColor}
        strokeWidth={Math.max(w, h) * 0.025}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {start && (
        <circle
          cx={start.x}
          cy={start.y}
          r={Math.max(w, h) * 0.032}
          fill="#ffffff"
          stroke="#ff3366"
          strokeWidth={Math.max(w, h) * 0.012}
        />
      )}
    </svg>
  );
};
