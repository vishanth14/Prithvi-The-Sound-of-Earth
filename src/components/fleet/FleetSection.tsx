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
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <SectionHeader
          number="03.5"
          category="NASA EARTH SYSTEM OBSERVATORY"
          title="ORBITAL SATELLITE CONSTELLATIONS"
          subtitle="Continuous low-Earth orbit telemetry streams empirical data into PRITHVI. Each satellite instrument measures a distinct planetary vital sign."
          badge="5 MISSIONS ACTIVE"
          badgeVariant="sand"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {SATELLITE_FLEET.map((sat) => (
            <Panel
              key={sat.id}
              className="fleet-card flex flex-col justify-between group hover:border-[#D1B77D]/40 transition-all duration-300 bg-[#0C1017] border-[#F0EEE5]/10 p-7"
            >
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F0EEE5]/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sat.color }}
                    />
                    <span className="font-mono text-xs text-[#D1B77D] tracking-wider uppercase">
                      LAUNCH {sat.launchYear}
                    </span>
                  </div>
                  <Badge variant="sand">LEO</Badge>
                </div>

                <h3 className="font-serif text-2xl font-normal text-[#F0EEE5] mb-2 group-hover:text-[#D1B77D] transition-colors">
                  {sat.name}
                </h3>

                <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/70 leading-relaxed mb-6">
                  {sat.observationalFocus}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0EEE5]/10 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Orbit Altitude:</span>
                  <span className="text-[#F0EEE5] font-semibold">{sat.orbitAltitudeKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Inclination:</span>
                  <span className="text-[#F0EEE5] font-semibold">{sat.orbitInclinationDeg}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Primary Sensor:</span>
                  <span className="text-[#D1B77D] truncate max-w-[180px] font-semibold">
                    {sat.primarySensor}
                  </span>
                </div>
              </div>
            </Panel>
          ))}

          {/* NASA Earth Information Center summary card */}
          <Panel className="fleet-card flex flex-col justify-between border-[#E16D54]/30 bg-[#0C1017] p-7">
            <div>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#F0EEE5]/10 text-[#E16D54]">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                  EIC INTEGRATION
                </span>
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#F0EEE5] mb-2">
                Earth Information Center
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/75 leading-relaxed">
                PRITHVI connects the public to NASA’s operational Earth Science Division, translating
                raw telemetry streams into accessible visual geometries and harmonic audio.
              </p>
            </div>

            <div className="pt-5 border-t border-[#F0EEE5]/10 flex items-center justify-between text-xs font-mono text-[#D1B77D]">
              <span>NASA Headquarters & Goddard</span>
              <span className="text-[#F0EEE5]/50">2026 Space Apps</span>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
};
