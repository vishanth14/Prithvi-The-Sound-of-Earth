import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Number of stars scaled to resolution, capped for restrained elegance
    const STAR_COUNT = Math.min(220, Math.floor((width * height) / 8000));
    const stars: Star[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // depth factor
        size: Math.random() * 1.2 + 0.4,
        baseAlpha: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Smooth mouse parallax damping
      mouseX += (targetMouseX - mouseX) * 0.02;
      mouseY += (targetMouseY - mouseY) * 0.02;

      const offsetX = (mouseX - width / 2) * 0.015;
      const offsetY = (mouseY - height / 2) * 0.015;

      // Dark cosmos background
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, width, height);

      // Restrained deep space gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2 - offsetX * 2,
        height * 0.4 - offsetY * 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(12, 23, 48, 0.45)');
      bgGrad.addColorStop(0.5, 'rgba(6, 11, 24, 0.2)');
      bgGrad.addColorStop(1, 'rgba(2, 4, 10, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Fine observatory coordinate grid (subtle hairline ticks)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
      ctx.lineWidth = 1;

      const gridSize = 140;
      const startX = ((offsetX * 0.5) % gridSize) - gridSize;
      const startY = ((offsetY * 0.5) % gridSize) - gridSize;

      ctx.beginPath();
      for (let x = startX; x < width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw restrained stars with subtle twinkling
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Gentle drift
        star.y -= 0.08 * star.z;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        // Twinkle calculation
        star.phase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
        const clampedAlpha = Math.max(0.08, Math.min(0.85, currentAlpha));

        const drawX = star.x + offsetX * star.z;
        const drawY = star.y + offsetY * star.z;

        // Draw star
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * star.z, 0, Math.PI * 2);

        // Rare slight cyan tint for distant blue giants, mostly pure off-white
        if (i % 7 === 0) {
          ctx.fillStyle = `rgba(186, 230, 253, ${clampedAlpha})`;
        } else if (i % 13 === 0) {
          ctx.fillStyle = `rgba(254, 240, 138, ${clampedAlpha * 0.9})`;
        } else {
          ctx.fillStyle = `rgba(248, 250, 252, ${clampedAlpha})`;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      aria-hidden="true"
    />
  );
};
