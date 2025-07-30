'use client';

import { useEffect, useState, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 30, onComplete }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const currentIndexRef = useRef(0);
  const rafIdRef = useRef<number>();

  useEffect(() => {
    // 重置状态
    currentIndexRef.current = 0;
    setDisplayText('');

    if (!text) return;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= speed) {
        if (currentIndexRef.current < text.length) {
          const charsToAdd = Math.min(
            Math.ceil(deltaTime / speed),
            text.length - currentIndexRef.current
          );
          
          currentIndexRef.current += charsToAdd;
          setDisplayText(text.substring(0, currentIndexRef.current));
          
          lastTime = currentTime;
        } else {
          // 动画完成
          onComplete?.();
          return;
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return <span>{displayText}</span>;
}