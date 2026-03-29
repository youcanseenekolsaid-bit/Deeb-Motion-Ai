import React from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';

export const GridBackground: React.FC<{
  color?: string;
  backgroundColor?: string;
  gridSize?: number;
  speed?: number;
}> = ({ color = 'rgba(255, 255, 255, 0.1)', backgroundColor = '#0a0a0a', gridSize = 60, speed = 1 }) => {
  const frame = useCurrentFrame();
  const offset = (frame * speed) % gridSize;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: -gridSize,
          left: -gridSize,
          right: -gridSize,
          bottom: -gridSize,
          backgroundImage: `
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          transform: `translate(${offset}px, ${offset}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
