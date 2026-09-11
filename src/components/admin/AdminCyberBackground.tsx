import React, { useEffect, useRef } from 'react';

interface AdminCyberBackgroundProps {
  enabled?: boolean;
  mode?: 'matrix' | 'binary' | 'grid' | 'terminal' | 'neon' | 'wifi' | 'typing';
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
  mode = 'matrix',
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

    const characters = mode === 'binary'
      ? '010101001101001011010101'
      : '010101100101GATEWAYCONNECT01011001ZIMBABWE0101KERNEL0x7F0xA4SECURE0101APOSTOLIC1010ROOT';
    
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

      ctx.fillStyle = mode === 'neon' ? 'rgba(8, 5, 24, 0.18)' : 'rgba(0, 10, 20, 0.16)';
      ctx.fillRect(0, 0, width, height);

      if (mode === 'grid') {
        const spacing = width < 640 ? 32 : 48;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += spacing) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y <= height; y += spacing) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        const pulseX = (currentTime / 8) % (width + spacing) - spacing;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
        ctx.beginPath(); ctx.moveTo(pulseX, 0); ctx.lineTo(pulseX, height); ctx.stroke();
        return;
      }

      if (mode === 'neon') {
        const pulse = (Math.sin(currentTime / 500) + 1) / 2;
        ctx.fillStyle = `rgba(168, 85, 247, ${0.04 + pulse * 0.1})`;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.2 + pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * (0.2 + pulse * 0.15), 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      if (mode === 'terminal') {
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
        for (let line = 0; line < Math.ceil(height / (fontSize * 1.8)); line += 1) {
          const y = ((line * fontSize * 1.8 + currentTime / 18) % (height + fontSize * 2)) - fontSize;
          ctx.fillText(`[${String(Math.floor(currentTime / 1000)).padStart(5, '0')}] ${line % 2 ? 'SYNC' : 'EVENT'} gateway.${line % 3 ? 'live' : 'admin'} status=ok`, 12, y);
        }
        return;
      }

      if (mode === 'wifi') {
        const spacing = width < 640 ? 42 : 64;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 1;
        for (let x = spacing / 2; x < width; x += spacing) {
          for (let y = spacing / 2; y < height; y += spacing) {
            const pulse = (Math.sin(currentTime / 500 + x / 80 + y / 90) + 1) / 2;
            ctx.fillStyle = `rgba(34, 211, 238, ${0.25 + pulse * 0.55})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + pulse * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 8 + pulse * 12, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 15 + pulse * 15, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
          }
        }
        return;
      }

      if (mode === 'typing') {
        const lines = [
          '> gateway.connect()',
          '> syncing presence...',
          '> event stream ready',
          '> listening for updates...'
        ];
        ctx.font = `${fontSize}px monospace`;
        lines.forEach((line, index) => {
          const charactersVisible = Math.floor((currentTime / 55 + index * 7) % (line.length + 12));
          ctx.fillStyle = index % 2 === 0 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(212, 175, 55, 0.8)';
          ctx.fillText(line.slice(0, Math.min(line.length, charactersVisible)), 16, 30 + index * (fontSize + 12));
          if (charactersVisible <= line.length) ctx.fillText('_', 16 + ctx.measureText(line.slice(0, charactersVisible)).width, 30 + index * (fontSize + 12));
        });
        return;
      }

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const isLead = Math.random() > (mode === 'binary' ? 0.92 : 0.85);
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
  }, [enabled, mode]);

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

