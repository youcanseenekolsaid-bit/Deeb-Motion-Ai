import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
  floatSpeed?: number;
  floatAmplitude?: number;
}> = ({ icon, style, delay = 0, floatSpeed = 0.05, floatAmplitude = 20 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 200 },
  });

  const yOffset = Math.sin((frame - delay) * floatSpeed) * floatAmplitude;

  return (
    <div
      style={{
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {icon}
    </div>
  );
};
