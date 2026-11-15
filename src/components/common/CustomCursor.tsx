import React, { useEffect, useRef, useState } from 'react';

/**
 * Custom Space-Inspired Aerospace HUD Cursor
 * 
 * Complies with strict guidelines:
 * 1. Does not globally disable the browser cursor.
 * 2. Does not interfere with text selection or native pointer events (pointer-events-none throughout).
 * 3. Completely disabled on touch/coarse pointer devices.
 * 4. Shows context labels, subtle magnetic movement, and restrained hover transition when hovering interactive elements.
 */
export const CustomCursor: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const [isTextHovered, setIsTextHovered] = useState(false);

  const mousePos = useRef({ x: -100, y: -100 });
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Detect touch / coarse pointer devices
    const isCoarse =
      window.matchMedia('(pointer: coarse)').matches ||
      !window.matchMedia('(hover: hover)').matches ||
      'ontouchstart' in window;

    if (isCoarse) {
      setIsTouchDevice(true);
      return;
    }
    setIsTouchDevice(false);

    const handlePointerMove = (e: PointerEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Inspect target element for interactive or text hover states
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if over text elements (to prevent any distraction while reading/selecting text)
      const textTag = target.tagName.toLowerCase();
      const isText =
        ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote'].includes(
          textTag
        ) && !target.closest('button, a, [role="button"]');
      setIsTextHovered(isText);

      // Find closest interactive element
      const interactiveEl = target.closest(
        'button, a, [role="button"], input, select, canvas, [data-cursor-label], [data-cursor-magnetic]'
      ) as HTMLElement | null;

      if (interactiveEl) {
        setHovered(true);

        // Extract context label
        const explicitLabel = interactiveEl.getAttribute('data-cursor-label');
        if (explicitLabel) {
          setContextLabel(explicitLabel);
        } else if (interactiveEl.tagName.toLowerCase() === 'canvas') {
          setContextLabel('ORBIT 3D');
        } else if (interactiveEl.tagName.toLowerCase() === 'a' || interactiveEl.tagName.toLowerCase() === 'button') {
          const text = interactiveEl.innerText?.trim();
          if (text && text.length > 0 && text.length <= 20) {
            setContextLabel(text.toUpperCase());
          } else {
            setContextLabel('SELECT');
          }
        } else {
          setContextLabel(null);
        }

        // Check for magnetic pull
        const isMagnetic =
          interactiveEl.hasAttribute('data-cursor-magnetic') ||
          interactiveEl.tagName.toLowerCase() === 'button' ||
          interactiveEl.classList.contains('cursor-magnetic');

        if (isMagnetic) {
          const rect = interactiveEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const pullStrength = 0.28; // Subtle aerospace magnetic pull

          targetPos.current = {
            x: e.clientX + (centerX - e.clientX) * pullStrength,
            y: e.clientY + (centerY - e.clientY) * pullStrength,
          };
        }
      } else {
        setHovered(false);
        setContextLabel(null);
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
      setHovered(false);
      setContextLabel(null);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // High performance interpolation loop (lerp)
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const render = () => {
      // Lerp current towards target
      const lerpFactor = 0.2;
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, lerpFactor);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, lerpFactor);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  // If on touch device, render nothing
  if (isTouchDevice) return null;

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] select-none transition-opacity duration-200 ${
        visible && !isTextHovered ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* 1. Precision Center Dot */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-none transition-all duration-200 ${
          hovered ? 'w-1.5 h-1.5 bg-[#FF5938]' : 'w-1 h-1 bg-[#E9EDF0]'
        }`}
      />

      {/* 2. Space HUD Reticle Ring with 4 Cardinal Crosshairs */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 ease-out flex items-center justify-center ${
          hovered
            ? 'w-11 h-11 border-[#FF5938]/70 bg-[#FF5938]/5 scale-100'
            : 'w-7 h-7 border-[#83BBD5]/30 bg-transparent scale-90'
        }`}
      >
        {/* Subtle cardinal crosshair tick marks */}
        <span
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1 ${
            hovered ? 'bg-[#FF5938]' : 'bg-[#83BBD5]/40'
          }`}
        />
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1 ${
            hovered ? 'bg-[#FF5938]' : 'bg-[#83BBD5]/40'
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-1 ${
            hovered ? 'bg-[#FF5938]' : 'bg-[#83BBD5]/40'
          }`}
        />
        <span
          className={`absolute right-0 top-1/2 -translate-y-1/2 h-[1px] w-1 ${
            hovered ? 'bg-[#FF5938]' : 'bg-[#83BBD5]/40'
          }`}
        />
      </div>

      {/* 3. Floating Context Label */}
      {contextLabel && (
        <div className="absolute left-6 top-2 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#070B10]/95 border border-[#FF5938]/50 shadow-lg backdrop-blur-sm">
            <span className="w-1 h-1 bg-[#FF5938] animate-pulse" />
            <span className="font-mono text-[9px] font-bold tracking-widest text-[#E9EDF0] uppercase">
              {contextLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
