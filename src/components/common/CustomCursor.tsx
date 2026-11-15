import React, { useEffect, useRef, useState } from 'react';
import { uiAudioFeedback } from '../../audio/uiAudioFeedback';

/**
 * PRITHVI — Minimal Orbital Aerospace Cursor & Magnetic Interaction System
 * 
 * Features:
 * 1. Minimal orbital design: precision central point with a subtle outer ring and orbiting node.
 * 2. Contextual action badges: EXPLORE, ROTATE, LISTEN, OPEN, DISCOVER.
 * 3. Zero-rerender coordinate tracking: direct DOM transforms in requestAnimationFrame.
 * 4. Restrained magnetic pull: subtly attracts toward major CTAs.
 * 5. Text selection preservation: dims completely over readable prose to never obstruct reading.
 * 6. Touch & reduced-motion fallback: automatically disabled on touch devices and respected in CSS.
 * 7. Luxury tactile UI audio: soft micro-ticks on hover/click when audio is unlocked.
 */
export const CustomCursor: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [contextLabel, setContextLabel] = useState<string | null>(null);

  // Mutable refs for zero-rerender 60fps tracking
  const mousePos = useRef({ x: -100, y: -100 });
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  // Magnetic element tracking
  const activeMagneticEl = useRef<HTMLElement | null>(null);

  // Internal state caches to prevent redundant React re-renders
  const lastHoveredRef = useRef(false);
  const lastTextModeRef = useRef(false);
  const lastLabelRef = useRef<string | null>(null);

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

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: PointerEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Text Selection Detection
      const textTag = target.tagName.toLowerCase();
      const isReadableText =
        ['p', 'blockquote', 'article', 'pre', 'code'].includes(textTag) &&
        !target.closest('button, a, [role="button"], [data-cursor-label]');

      if (isReadableText !== lastTextModeRef.current) {
        lastTextModeRef.current = isReadableText;
        setIsTextMode(isReadableText);
      }

      // 2. Interactive Element Detection
      const interactiveEl = target.closest(
        'button, a, [role="button"], input, select, canvas, [data-cursor-label], [data-magnetic="true"], [data-cursor-magnetic="true"]'
      ) as HTMLElement | null;

      const isInteractive = Boolean(interactiveEl);

      // Determine contextual label
      let nextLabel: string | null = null;
      if (interactiveEl) {
        const explicitLabel = interactiveEl.getAttribute('data-cursor-label');
        if (explicitLabel) {
          nextLabel = explicitLabel.toUpperCase();
        } else if (interactiveEl.tagName.toLowerCase() === 'canvas') {
          nextLabel = 'ROTATE';
        } else {
          // Infer context based on semantic action keywords
          const text = (interactiveEl.innerText || '').toLowerCase();
          const href = (interactiveEl.getAttribute('href') || '').toLowerCase();
          const title = (interactiveEl.getAttribute('title') || '').toLowerCase();
          const ariaLabel = (interactiveEl.getAttribute('aria-label') || '').toLowerCase();
          const combined = `${text} ${href} ${title} ${ariaLabel}`;

          if (
            interactiveEl.getAttribute('type') === 'range' ||
            combined.includes('scrub') ||
            combined.includes('timeline') ||
            combined.includes('slider') ||
            combined.includes('drag')
          ) {
            nextLabel = 'DRAG';
          } else if (
            combined.includes('listen') ||
            combined.includes('audio') ||
            combined.includes('play') ||
            combined.includes('pause') ||
            combined.includes('sound') ||
            combined.includes('mute') ||
            combined.includes('speed') ||
            combined.includes('replay') ||
            combined.includes('loop')
          ) {
            nextLabel = 'LISTEN';
          } else if (
            combined.includes('explore') ||
            combined.includes('journey') ||
            combined.includes('layer') ||
            combined.includes('sentinel') ||
            combined.includes('station')
          ) {
            nextLabel = 'EXPLORE';
          } else if (
            combined.includes('discover') ||
            combined.includes('story') ||
            combined.includes('fleet') ||
            combined.includes('mission')
          ) {
            nextLabel = 'DISCOVER';
          } else if (
            combined.includes('open') ||
            combined.includes('http') ||
            combined.includes('github') ||
            combined.includes('svs') ||
            combined.includes('external') ||
            combined.includes('export') ||
            combined.includes('download')
          ) {
            nextLabel = 'OPEN';
          } else if (combined.includes('rotate') || combined.includes('orbit')) {
            nextLabel = 'ROTATE';
          } else if (interactiveEl.tagName.toLowerCase() === 'a' || interactiveEl.tagName.toLowerCase() === 'button') {
            nextLabel = 'EXPLORE';
          }
        }
      }

      // 3. Magnetic Interaction on Major CTAs
      const isMagnetic = interactiveEl?.hasAttribute('data-cursor-magnetic') ||
        interactiveEl?.hasAttribute('data-magnetic') ||
        interactiveEl?.classList.contains('cursor-magnetic');

      if (isMagnetic && interactiveEl && !prefersReducedMotion) {
        const rect = interactiveEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        // Restrained magnetic attraction: pulls button by max 8px
        const maxOffset = 9;
        const pullStrength = 0.24;
        const btnOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dx * pullStrength));
        const btnOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dy * pullStrength));

        interactiveEl.style.transform = `translate3d(${btnOffsetX}px, ${btnOffsetY}px, 0)`;
        activeMagneticEl.current = interactiveEl;

        // Pull cursor toward element center slightly
        targetPos.current.x = e.clientX - dx * 0.15;
        targetPos.current.y = e.clientY - dy * 0.15;
      } else if (activeMagneticEl.current) {
        // Smoothly release previous magnetic element
        activeMagneticEl.current.style.transform = 'translate3d(0, 0, 0)';
        activeMagneticEl.current = null;
      }

      // 4. Update React State ONLY on Change (Zero-Rerender Loop)
      if (isInteractive !== lastHoveredRef.current) {
        lastHoveredRef.current = isInteractive;
        setHovered(isInteractive);
        if (isInteractive) {
          uiAudioFeedback.play('hover');
        }
      }

      if (nextLabel !== lastLabelRef.current) {
        lastLabelRef.current = nextLabel;
        setContextLabel(nextLabel);
      }
    };

    const handlePointerDown = () => {
      uiAudioFeedback.play('click');
      if (ringRef.current) {
        ringRef.current.style.transform = 'scale(0.85)';
      }
    };

    const handlePointerUp = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = '';
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
      setHovered(false);
      setContextLabel(null);
      if (activeMagneticEl.current) {
        activeMagneticEl.current.style.transform = 'translate3d(0, 0, 0)';
        activeMagneticEl.current = null;
      }
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Continuous 60fps Interpolation Loop (lerp)
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const render = () => {
      const lerpFactor = prefersReducedMotion ? 1 : 0.22;
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
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (activeMagneticEl.current) {
        activeMagneticEl.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };
  }, [visible]);

  // Touch devices use native browser touch indicators
  if (isTouchDevice) return null;

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] select-none transition-opacity duration-200 ${
        visible && !isTextMode ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* 1. Precision Center Point (2px starlight dot, shifts to Launch Orange on interactive hover) */}
      <div
        ref={dotRef}
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
          hovered ? 'w-2 h-2 bg-[#FF5938] shadow-[0_0_8px_#FF5938]' : 'w-1.5 h-1.5 bg-[#E9EDF0]'
        }`}
      />

      {/* 2. Minimal Orbital Ring (Fine 26px circle expanding smoothly to 44px on hover) */}
      <div
        ref={ringRef}
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 ease-out flex items-center justify-center ${
          hovered
            ? 'w-11 h-11 border-[#FF5938]/60 bg-[#FF5938]/5 scale-100'
            : 'w-6 h-6 border-[#83BBD5]/30 bg-transparent scale-90'
        }`}
      >
        {/* Orbiting Satellite Node (Rotates along outer orbital ring) */}
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
          <span
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-colors duration-200 ${
              hovered ? 'bg-[#FF5938]' : 'bg-[#83BBD5]/50'
            }`}
          />
        </div>

        {/* Cardinal orientation ticks */}
        <span
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1 ${
            hovered ? 'bg-[#FF5938]/80' : 'bg-[#83BBD5]/25'
          }`}
        />
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1 ${
            hovered ? 'bg-[#FF5938]/80' : 'bg-[#83BBD5]/25'
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-1 ${
            hovered ? 'bg-[#FF5938]/80' : 'bg-[#83BBD5]/25'
          }`}
        />
        <span
          className={`absolute right-0 top-1/2 -translate-y-1/2 h-[1px] w-1 ${
            hovered ? 'bg-[#FF5938]/80' : 'bg-[#83BBD5]/25'
          }`}
        />
      </div>

      {/* 3. Restrained Context Label Pill */}
      {contextLabel && (
        <div className="absolute left-6 top-3 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#070B10]/95 border border-[#FF5938]/40 shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <span className="w-1 h-1 bg-[#FF5938] animate-pulse" />
            <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#E9EDF0] uppercase">
              {contextLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
