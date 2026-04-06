// TestWatermark.tsx
// Grid-based watermark distribution with student email and current date/time.
// 9 watermarks in 3x3 grid pattern for even distribution.
// Theme-aware (works in both light and dark modes).
// Fully visible but subtle (balanced opacity and sizing).

import { useEffect, useState } from 'react';

interface TestWatermarkProps {
  studentEmail?: string;
}

const TestWatermark = ({ studentEmail = 'Student' }: TestWatermarkProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const watermarkText = `${studentEmail} • ${currentTime}`;

  // 9 watermark positions in a 3x3 grid
  const gridPositions = [
    // Row 1
    { top: '12%', left: '10%', rotation: -25 },
    { top: '12%', left: '50%', rotation: 0, transform: 'translateX(-50%)' },
    { top: '12%', right: '10%', rotation: 25 },
    // Row 2
    { top: '50%', left: '10%', rotation: 25, transform: 'translateY(-50%)' },
    { top: '50%', left: '50%', rotation: -15, transform: 'translate(-50%, -50%)' },
    { top: '50%', right: '10%', rotation: -25, transform: 'translateY(-50%)' },
    // Row 3
    { bottom: '12%', left: '10%', rotation: -25 },
    { bottom: '12%', left: '50%', rotation: 0, transform: 'translateX(-50%)' },
    { bottom: '12%', right: '10%', rotation: 25 },
  ];

  return (
    <>
      {/* 9 Grid Watermarks */}
      {gridPositions.map((pos, idx) => (
        <div
          key={idx}
          className="fixed pointer-events-none select-none z-0"
          style={{
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            right: pos.right,
            transform: `rotate(${pos.rotation}deg) ${pos.transform || ''}`,
            opacity: 0.22,
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            className="font-orbitron font-bold tracking-wider"
            style={{
              color: 'var(--watermark-text-color, #999999)',
              textShadow: 'var(--watermark-text-shadow, 0 0 2px rgba(0, 0, 0, 0.5))',
              letterSpacing: '0.05em',
            }}
          >
            {watermarkText}
          </div>
        </div>
      ))}

      {/* Background pattern overlay - subtle diagonal texture */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 500px,
              var(--watermark-pattern-light, rgba(200, 200, 200, 0.02)) 500px,
              var(--watermark-pattern-light, rgba(200, 200, 200, 0.02)) 1000px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 500px,
              var(--watermark-pattern-dark, rgba(50, 50, 50, 0.015)) 500px,
              var(--watermark-pattern-dark, rgba(50, 50, 50, 0.015)) 1000px
            )
          `,
        }}
      />
    </>
  );
};

export default TestWatermark;
