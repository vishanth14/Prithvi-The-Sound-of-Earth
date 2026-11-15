import React, { useRef, useState, useEffect } from 'react';

export interface InteractiveVisualFrameProps {
  children: React.ReactNode;
  captionTitle?: string;
  captionSubtitle?: string;
  officialId?: string;
  officialUrl?: string;
  className?: string;
  maxTiltDeg?: number;
  enableTilt?: boolean;
}

/**
 * PRITHVI — Interactive Aerospace Visual Frame
 * 
 * Provides:
 * 1. 3D cursor-following tilt and parallax depth movement (perspective + rotateX/rotateY).
 * 2. Restrained spring return on pointer exit.
 * 3. Technical chamfered clip-path and reticle corners.
 * 4. Image mask hover zoom.
 * 5. Animated telemetry caption overlay that smoothly reveals on hover.
 * 6. Zero React re-renders during high-frequency pointer movements.
 * 7. Disabled on touch devices and respects prefers-reduced-motion.
 */
export const InteractiveVisualFrame: React.FC<InteractiveVisualFrameProps> = ({
  children,
  captionTitle,
  captionSubtitle,
  officialId,
  officialUrl,
  className = '',
  maxTiltDeg = 6,
  enableTilt = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableTilt || prefersReducedMotionRef.current || e.pointerType === 'touch') return;

    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    // Invert Y for standard natural 3D tilt
    const rotX = -ny * maxTiltDeg;
    const rotY = nx * maxTiltDeg;

    el.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;

    if (innerRef.current) {
      // Secondary depth layer translates forward along Z axis
      innerRef.current.style.transform = `translate3d(${(nx * 5).toFixed(1)}px, ${(ny * 5).toFixed(1)}px, 16px)`;
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.1s ease-out';
    }
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 0.1s ease-out';
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      containerRef.current.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      innerRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`group relative overflow-hidden bg-[#070B10] border-2 border-[#252D36] transition-colors duration-300 hover:border-[#FF5938]/60 shadow-xl ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Precision Chamfered Reticle Corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF5938]/70 z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FF5938]/70 z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FF5938]/70 z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF5938]/70 z-20 pointer-events-none" />

      {/* Subtle Aerospace Coordinate Annotation */}
      <div className="absolute top-2 right-3 font-mono text-[9px] text-[#7E8B98] tracking-widest uppercase z-20 pointer-events-none flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="w-1 h-1 bg-[#FF5938]" />
        <span>EIC TELEMETRY FRAME</span>
      </div>

      {/* Inner 3D Content Container with Secondary Depth */}
      <div
        ref={innerRef}
        className="w-full h-full transform-gpu transition-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>

      {/* Interactive Telemetry Caption Reveal Overlay */}
      {(captionTitle || captionSubtitle || officialId) && (
        <div
          className={`absolute bottom-0 left-0 w-full z-20 p-3 sm:p-4 bg-gradient-to-t from-[#070B10] via-[#070B10]/95 to-transparent border-t border-[#252D36] transition-all duration-300 ease-out pointer-events-none ${
            isHovered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-85 sm:translate-y-full sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              {captionTitle && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF5938] animate-pulse" />
                  <span className="font-display text-xs sm:text-sm font-bold tracking-wide uppercase text-[#E9EDF0]">
                    {captionTitle}
                  </span>
                </div>
              )}
              {captionSubtitle && (
                <p className="font-mono text-[10px] text-[#83BBD5] mt-0.5">
                  {captionSubtitle}
                </p>
              )}
            </div>

            {officialId && (
              officialUrl ? (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor-label="OPEN"
                  className="pointer-events-auto shrink-0 px-2 py-0.5 bg-[#0E141D] hover:bg-[#FF5938] hover:text-[#070B10] border border-[#252D36] hover:border-[#FF5938] text-[10px] font-mono text-[#FF5938] uppercase font-bold transition-colors"
                >
                  {officialId}
                </a>
              ) : (
                <span className="shrink-0 px-2 py-0.5 bg-[#0E141D] border border-[#252D36] text-[10px] font-mono text-[#FF5938] uppercase font-bold">
                  {officialId}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
