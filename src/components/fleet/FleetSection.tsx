import React, { useRef } from 'react';
import { SATELLITE_FLEET } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Badge } from '../common/Badge';
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
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] z-10"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="03"
          category="NASA EARTH INFORMATION CENTER"
          title="ORBITAL SATELLITE CONSTELLATIONS"
          subtitle="Continuous low-Earth orbit telemetry streams empirical data into PRITHVI. Each satellite instrument measures a distinct Earth system vital sign."
          badge="5 MISSIONS ACTIVE"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SATELLITE_FLEET.map((sat) => (
            <Panel
              key={sat.id}
              className="fleet-card flex flex-col justify-between group hover:border-cyan-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sat.color }}
                    />
                    <span className="font-mono text-xs text-slate-400">
                      LAUNCH {sat.launchYear}
                    </span>
                  </div>
                  <Badge variant="neutral">LEO</Badge>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {sat.name}
                </h3>

                <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  {sat.observationalFocus}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Orbit Altitude:</span>
                  <span className="text-white">{sat.orbitAltitudeKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Inclination:</span>
                  <span className="text-white">{sat.orbitInclinationDeg}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Sensors:</span>
                  <span className="text-cyan-400/90 truncate max-w-[180px]">{sat.primarySensor}</span>
                </div>
              </div>
            </Panel>
          ))}

          {/* NASA Earth Information Center summary card */}
          <Panel className="fleet-card flex flex-col justify-between border-cyan-500/30 bg-cyan-950/20">
            <div>
              <div className="flex items-center gap-2 mb-4 text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest">
                  EIC INTEGRATION
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Earth Information Center
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                PRITHVI connects the public to NASA’s operational Earth Science Division, translating
                raw telemetry streams into accessible visual geometries and harmonic audio.
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-cyan-300">
              <span>NASA Headquarters & Goddard</span>
              <span className="text-slate-400">2026 Space Apps</span>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
};
