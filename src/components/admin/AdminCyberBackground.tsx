import React, { useEffect, useRef } from 'react';

interface AdminCyberBackgroundProps {
  enabled?: boolean;
  className?: string;
  opacity?: number;
}

/**
 * Cyber-Futuristic Hacker Background Component for Gateway Admin Panel & Dev Console
 * Rendered strictly BEHIND all UI layers with z-index: -10 and pointer-events-none.
 * Features:
 * - Matrix digital rain streams (binary, hex, apostolic cyber telemetry)
 * - Rendered strictly in background behind all cards, tables, inputs, modals and navigation
 * - Non-intrusive, lightweight 35 FPS throttled canvas
 */
export const AdminCyberBackground: React.FC<AdminCyberBackgroundProps> = ({ 
  enabled = true,
  className = '',
  opacity = 0.28
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const targetFps = 35;
    const interval = 1000 / targetFps;

    // Words and binary sequence for cyber telemetry aesthetic
    const characters = '010101100101GATEWAYCONNECT01011001ZIMBABWE0101KERNEL0x7F0xA4SECURE0101APOSTOLIC1010ROOT';
    
    let width = 0;
    let height = 0;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let fontSize = 12;

    const resize = () => {
      const parent = canvas.parentElement;
      width = canvas.width = parent?.clientWidth || window.innerWidth;
      height = canvas.height = parent?.clientHeight || window.innerHeight;
      
      // Responsive font size: smaller on mobile for dense matrix stream
      fontSize = width < 640 ? 10 : 13;
      columns = Math.floor(width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -30));
      speeds = Array.from({ length: columns }, () => 0.8 + Math.random() * 0.7);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      // Semi-transparent dark wash to produce trailing stream effect behind panels
      ctx.fillStyle = 'rgba(0, 10, 20, 0.16)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const isLead = Math.random() > 0.85;
        if (isLead) {
          ctx.fillStyle = '#f8fafc'; // Bright white/cyan lead
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#10b981';
        } else if (i % 7 === 0) {
          ctx.fillStyle = '#D4AF37'; // Kingdom Gold accent
          ctx.shadowBlur = 0;
        } else if (i % 4 === 0) {
          ctx.fillStyle = '#38bdf8'; // Cyber Cyan
          ctx.shadowBlur = 0;
        } else if (i % 5 === 0) {
          ctx.fillStyle = '#c084fc'; // Purple hacker accent
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#10b981'; // Classic Matrix Emerald
          ctx.shadowBlur = 0;
        }

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += speeds[i] || 1;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none ${className}`}
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      <canvas 
        ref={canvasRef} 
        style={{ opacity }}
        className="w-full h-full block"
      />
    </div>
  );
};

