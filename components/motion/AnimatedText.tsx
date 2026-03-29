import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const AnimatedText: React.FC<{
  text: string;
  style?: React.CSSProperties;
  delay?: number;
  wordByWord?: boolean;
}> = ({ text, style, delay = 0, wordByWord = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (wordByWord) {
    const words = text.split(' ');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.3em', ...style }}>
        {words.map((word, i) => {
          const wordDelay = delay + i * 3;
          const scale = spring({
            fps,
            frame: frame - wordDelay,
            config: { damping: 12, stiffness: 200, mass: 0.5 },
          });
          const opacity = spring({
            fps,
            frame: frame - wordDelay,
            config: { damping: 20, stiffness: 100 },
          });
          return (
            <span key={i} style={{ transform: `scale(${scale})`, opacity, display: 'inline-block' }}>
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  // Character by character
  const chars = text.split('');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', ...style }}>
      {chars.map((char, i) => {
        const charDelay = delay + i * 1;
        const scale = spring({
          fps,
          frame: frame - charDelay,
          config: { damping: 12, stiffness: 200, mass: 0.5 },
        });
        const opacity = spring({
          fps,
          frame: frame - charDelay,
          config: { damping: 20, stiffness: 100 },
        });
        return (
          <span key={i} style={{ transform: `scale(${scale})`, opacity, display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
            {char}
          </span>
        );
      })}
    </div>
  );
};
