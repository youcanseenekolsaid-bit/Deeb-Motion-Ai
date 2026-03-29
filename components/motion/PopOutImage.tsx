import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, Img } from 'remotion';

export const PopOutImage: React.FC<{
  src: string;
  style?: React.CSSProperties;
  delay?: number;
}> = ({ src, style, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 10, stiffness: 150, mass: 0.8 },
  });

  const rotate = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <Img
      src={src}
      style={{
        transform: `scale(${scale}) rotate(${rotate * 5 - 5}deg)`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        borderRadius: '20px',
        ...style,
      }}
    />
  );
};
