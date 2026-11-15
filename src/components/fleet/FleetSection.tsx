import React, { useRef } from 'react';
import { SATELLITE_FLEET } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import { ReticleCorner } from '../common/AerospaceMark';
import { Radio } from 'lucide-react';

export const FleetSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.fleet-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="fleet"
      className="relative w-full py-20 px-6 sm:px-10 lg:px-16 border-t border-[#252D36]/20 z-10 bg-[#E9EDF0] text-[#070B10] pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="border-b border-[#252D36]/20 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#FF5938] font-bold">
              CHAPTER 02.5 // ORBITAL TELEMETRY
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#252D36] font-semibold">
              5 ACTIVE MISSIONS
            </span>
          </div>
          <h3 className="font-display font-extrabold text-4xl sm:text-6xl text-[#070B10] tracking-tight uppercase leading-[0.95]">
            THE EARTH OBSERVING CONSTELLATION
          </h3>
          <p className="font-sans text-sm sm:text-base text-[#252D36]/80 font-normal leading-relaxed max-w-3xl mt-3">
            Continuous low-Earth orbit telemetry streams empirical data into PRITHVI. Five active satellite instruments monitor Earth's dynamic vital signs in motion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {SATELLITE_FLEET.map((sat) => (
            <div
              key={sat.id}
              data-cursor-label="DISCOVER"
              className="fleet-card relative group flex flex-col justify-between bg-white border-2 border-[#252D36] p-7 shadow-sm hover:border-[#FF5938] hover:shadow-[0_12px_32px_rgba(255,89,56,0.14)] hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <ReticleCorner position="top-left" color="#252D36" />
              <ReticleCorner position="bottom-right" color="#252D36" />

              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#252D36]/20">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 transition-transform group-hover:scale-125"
                      style={{ backgroundColor: sat.color }}
                    />
                    <span className="font-mono text-xs text-[#252D36] tracking-wider uppercase font-bold">
                      LAUNCH {sat.launchYear}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#E9EDF0] text-[#070B10] font-mono text-[10px] uppercase font-bold border border-[#252D36]/20 group-hover:border-[#FF5938]/40">
                    LEO
                  </span>
                </div>

                <h4 className="font-display text-3xl font-extrabold text-[#070B10] group-hover:text-[#FF5938] uppercase tracking-tight group-hover:tracking-wide transition-all duration-200 mb-2">
                  {sat.name}
                </h4>

                <p className="font-sans text-xs sm:text-sm text-[#252D36]/80 leading-relaxed mb-6 font-normal">
                  {sat.observationalFocus}
                </p>
              </div>

              <div className="pt-4 border-t border-[#252D36]/20 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#252D36]/60">Orbit Altitude:</span>
                  <span className="text-[#070B10] font-semibold">{sat.orbitAltitudeKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#252D36]/60">Inclination:</span>
                  <span className="text-[#070B10] font-semibold">{sat.orbitInclinationDeg}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#252D36]/60">Primary Sensor:</span>
                  <span className="text-[#FF5938] truncate max-w-[180px] font-bold">
                    {sat.primarySensor}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* NASA Earth Information Center summary card */}
          <div className="fleet-card flex flex-col justify-between border-2 border-[#FF5938] bg-[#070B10] text-[#E9EDF0] p-7 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#252D36] text-[#FF5938]">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
                  EIC INTEGRATION
                </span>
              </div>
              <h4 className="font-display text-3xl font-extrabold text-[#E9EDF0] uppercase tracking-tight mb-2">
                Earth Information Center
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#E9EDF0]/80 leading-relaxed font-normal">
                PRITHVI connects the public to NASA’s operational Earth Science Division, translating
                raw telemetry streams into accessible visual geometries and harmonic audio.
              </p>
            </div>

            <div className="pt-5 border-t border-[#252D36] flex items-center justify-between text-xs font-mono text-[#83BBD5]">
              <span className="font-semibold">NASA Headquarters & Goddard</span>
              <span className="text-[#7E8B98]">2026 Space Apps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
