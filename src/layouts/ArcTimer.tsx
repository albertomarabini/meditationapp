import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ArcTimerProps = {
  progress: number;     // 0 to 1
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  segmentRatio?: number; // fraction of circle drawn (like 0.8)
};

export const ArcTimer: React.FC<ArcTimerProps> = ({
  progress,
  size = 220,
  thickness = 18,
  color = '#39e622',
  backgroundColor = '#333',
  segmentRatio = 0.8,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - thickness / 2;

  const totalAngle = 2 * Math.PI * segmentRatio;
  const startAngle = -Math.PI / 2 - totalAngle / 2;
  const endAngle = startAngle + totalAngle;

  // Helper: Converts polar coordinates to (x,y)
  const polarToXY = (angle: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  // Arc Path builder (SVG arc)
  function describeArc(start: number, end: number) {
    const startPt = polarToXY(start);
    const endPt = polarToXY(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return [
      `M ${startPt.x} ${startPt.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`,
    ].join(' ');
  }

  // Background arc (full segment)
  const bgPath = describeArc(startAngle, endAngle);
  // Foreground arc (progress)
  const fgEnd = startAngle + totalAngle * Math.max(0, Math.min(progress, 1));
  const fgPath = describeArc(startAngle, fgEnd);

  return (
    <Svg width={size} height={size}>
      {/* Background arc */}
      <Path
        d={bgPath}
        stroke={backgroundColor}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
      {/* Foreground (progress) arc */}
      {progress > 0 && (
        <Path
          d={fgPath}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          // Optional: Glow effect (not natively supported)
        />
      )}
    </Svg>
  );
};
