import React, { useRef, useState } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { gsap, useGSAP } from '../../lib/gsap';
import {
  Database,
  ShieldCheck,
  Award,
  ExternalLink,
  Globe,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { EicDataService } from '../../data/eicDataService';

export const MethodologySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [copiedCitationIdx, setCopiedCitationIdx] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.source-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.75,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  const handleCopyCitation = (citation: string, idx: number) => {
    navigator.clipboard.writeText(citation);
    setCopiedCitationIdx(idx);
    setTimeout(() => setCopiedCitationIdx(null), 2500);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const all = await EicDataService.loadAllDatasets();
      const gistemp = all.gistemp.observations;
      const co2 = all.co2_maunaloa.observations;
      const seaLevel = all.sealevel_podaac.observations;
      const aerosols = all.aerosols_geos.observations;
      const nightlights = all.nightlights_viirs.observations;

      // Group by year
      const years = Array.from(new Set(gistemp.map((o) => o.year))).sort((a, b) => a - b);

      const header = 'Year,GISTEMP_Anomaly_C,Mauna_Loa_CO2_ppm,PODAAC_Sea_Level_mm,GEOS_Aerosols_AOD,VIIRS_Nightlights_nW_cm2_sr\n';
      const rows = years.map((y) => {
        const g = gistemp.find((o) => o.year === y)?.originalValue ?? '';
        const c = co2.find((o) => o.year === y)?.originalValue ?? '';
        const s = seaLevel.find((o) => o.year === y)?.originalValue ?? '';
        const a = aerosols.find((o) => o.year === y)?.originalValue ?? '';
        const n = nightlights.find((o) => o.year === y)?.originalValue ?? '';
        return `${y},${g},${c},${s},${a},${n}`;
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + rows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `prithvi-nasa-eic-earth-observations-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const sources = [
    {
      title: 'NASA GISTEMP v4 Surface Temperature',
      agency: 'NASA Goddard Institute for Space Studies (GISS)',
      citation: 'GISTEMP Team, 2026: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies.',
      url: 'https://data.giss.nasa.gov/gistemp/',
    },
    {
      title: 'Atmospheric CO₂ Concentrations (Mauna Loa)',
      agency: 'NOAA Global Monitoring Laboratory & Scripps Institution of Oceanography',
      citation: 'Keeling et al., 2026: Atmospheric Carbon Dioxide Dry Air Mole Fractions from the Mauna Loa Observatory, Hawaii.',
      url: 'https://gml.noaa.gov/ccgg/trends/',
    },
    {
      title: 'Global Mean Sea Level Satellite Altimetry',
      agency: 'NASA Physical Oceanography DAAC (PO.DAAC) / JPL',
      citation: 'Beckley et al., 2026: Global Mean Sea Level Trend from TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, and Sentinel-6 Michael Freilich.',
      url: 'https://podaac.jpl.nasa.gov/',
    },
    {
      title: 'Terra & Aqua MODIS NDVI Terrestrial Biosphere',
      agency: 'NASA Land Processes DAAC (LP DAAC) / GSFC',
      citation: 'Didan, K., 2026: MOD13A2 MODIS/Terra Vegetation Indices 16-Day L3 Global 1km SIN Grid V061.',
      url: 'https://lpdaac.usgs.gov/',
    },
    {
      title: 'Stratospheric Ozone Minimum (TOMS/OMI/OMPS)',
      agency: 'NASA Ozone Watch / Goddard Space Flight Center',
      citation: 'Newman, P. A., et al., 2026: NASA Ozone Watch Historical Antarctic Column Ozone Database.',
      url: 'https://ozonewatch.gsfc.nasa.gov/',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="open-science"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#252D36] z-10 bg-[#070B10] pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <SectionHeader
          number="06"
          category="SOURCES, ACCESSIBILITY & CREDITS"
          title="OPEN SCIENCE"
          subtitle="PRITHVI is built upon open NASA Earth observation data architectures, honoring rigorous open-science principles, WCAG 2.2 AA accessibility, and transparent telemetry verification."
          badge="OPEN SCIENCE"
          badgeVariant="signal"
        />

        {/* Open Science Data Export Action Banner */}
        <Panel className="border-[#252D36] bg-[#0E141D] flex flex-col sm:flex-row items-center justify-between gap-5 p-6 sm:p-8 rounded-none">
          <div className="flex items-center gap-4">
            <div className="p-3 border border-[#252D36] bg-[#070B10] text-[#FF5938] rounded-none shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#E9EDF0]">
                Download Calibrated Earth Observations (CSV)
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#E9EDF0]/75 mt-1 leading-relaxed font-normal">
                Export all validated NASA EIC multi-decadal time-series (GISTEMP, Mauna Loa CO₂, PO.DAAC Sea Level, GEOS Aerosols, VIIRS Radiance) for independent verification or research.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleExportCsv}
            disabled={isExporting}
            data-cursor-label="EXPORT"
            data-cursor-magnetic="true"
            icon={<Download className="w-4 h-4 text-white" />}
            className="shrink-0 w-full sm:w-auto hover:tracking-widest transition-all duration-300"
          >
            {isExporting ? 'GENERATING CSV...' : 'EXPORT OBSERVATIONS (CSV)'}
          </Button>
        </Panel>

        {/* Scientific Sources Grid */}
        <div className="space-y-4">
          <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-[0.2em] block mb-2 font-semibold">
            OFFICIAL SCIENTIFIC DATA REPOSITORIES:
          </span>

          {sources.map((s, idx) => (
            <Panel
              key={idx}
              className="source-card p-5 sm:p-6 bg-[#0E141D] border-[#252D36] flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-none"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#FF5938]" />
                  <span className="font-display text-xl font-bold uppercase tracking-wide text-[#E9EDF0]">
                    {s.title}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#83BBD5]">{s.agency}</p>
                <p className="font-mono text-xs text-[#E9EDF0]/70">{s.citation}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleCopyCitation(s.citation, idx)}
                  data-cursor-label="COPY"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono border border-[#252D36] bg-[#070B10] hover:border-[#83BBD5] text-[#E9EDF0]/70 hover:text-white transition-colors cursor-pointer rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938]"
                  title="Copy BibTeX / APA citation to clipboard"
                >
                  {copiedCitationIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[#10B981]">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#E9EDF0]/50" />
                      <span>COPY CITATION</span>
                    </>
                  )}
                </button>

                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor-label="OPEN"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono border border-[#252D36] bg-[#070B10] hover:border-[#FF5938] text-[#E9EDF0] hover:text-[#FF5938] transition-colors rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938]"
                >
                  <span>DATA ARCHIVE</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Panel>
          ))}
        </div>

        {/* Software Architecture Blueprint Card */}
        <Panel className="border-[#252D36] bg-[#0E141D] p-6 sm:p-8 rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
            <div className="flex items-center gap-2.5 text-[#FF5938]">
              <Globe className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
                SOFTWARE ARCHITECTURE & SCIENTIFIC STACK
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#E9EDF0]/50 uppercase">CLIENT-SIDE ONLY • ZERO TELEMETRY TRACKING</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#FF5938] block text-[10px] uppercase mb-1 font-bold">PLANETARY ENGINE</span>
              <span className="text-[#E9EDF0] font-bold block">Three.js + R3F</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">4K NASA Textures & Shaders</span>
            </div>
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#FF5938] block text-[10px] uppercase mb-1 font-bold">SYNTHESIS CORE</span>
              <span className="text-[#E9EDF0] font-bold block">Web Audio + Tone.js</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">Deterministic Sonification</span>
            </div>
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#10B981] block text-[10px] uppercase mb-1 font-bold">DATA INTEGRITY</span>
              <span className="text-[#E9EDF0] font-bold block">Zod + PapaParse</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">Schema-validated CSVs</span>
            </div>
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#83BBD5] block text-[10px] uppercase mb-1 font-bold">VISUALIZATION</span>
              <span className="text-[#E9EDF0] font-bold block">D3.js Polar Projections</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">NASA SVS #5190 Spiral</span>
            </div>
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#83BBD5] block text-[10px] uppercase mb-1 font-bold">ANIMATION LOOP</span>
              <span className="text-[#E9EDF0] font-bold block">GSAP 3 + Lenis</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">60 FPS Synchronization</span>
            </div>
            <div className="p-3 bg-[#070B10] border border-[#252D36] rounded-none">
              <span className="text-[#E9EDF0] block text-[10px] uppercase mb-1 font-bold">EDITORIAL DESIGN</span>
              <span className="text-[#E9EDF0] font-bold block">Tailwind CSS v4</span>
              <span className="text-[#E9EDF0]/50 text-[10px]">WCAG 2.2 AA Contrast</span>
            </div>
          </div>
        </Panel>

        {/* Space Apps Mission Information & Accessibility Statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-8 border-t border-[#252D36]">
          <Panel className="flex flex-col justify-between bg-[#0E141D] border-[#252D36] p-7 sm:p-8 rounded-none">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#252D36] text-[#FF5938]">
                <Award className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
                  CHALLENGE PARTICIPATION
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#E9EDF0] mb-3 tracking-tight">
                NASA Space Apps Challenge 2026
              </h3>
              <p className="font-mono text-xs sm:text-sm text-[#E9EDF0]/80 leading-relaxed mb-4">
                <strong>Challenge:</strong> The Earth Information Jukebox<br />
                <strong>Team:</strong> MULTIVERSE VENDHAN<br />
                <strong>Project:</strong> PRITHVI — The Sound of Earth
              </p>
              <p className="font-sans text-xs text-[#E9EDF0]/70 leading-relaxed font-normal">
                Created to empower citizens, educators, and scientists to listen to planetary health
                and engage with NASA's Earth System Observatory through harmonic sound and spatial graphics.
              </p>
            </div>
          </Panel>

          <Panel className="flex flex-col justify-between bg-[#0E141D] border-[#252D36] p-7 sm:p-8 rounded-none">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#252D36] text-[#10B981]">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
                  MULTIMODAL ACCESSIBILITY
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#E9EDF0] mb-3 tracking-tight">
                WCAG 2.2 AA Conformance
              </h3>
              <div className="space-y-2.5 text-xs font-sans text-[#E9EDF0]/80 font-normal">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span><strong>Visual-to-Audio Equivalence:</strong> Every acoustic parameter has a real-time numeric and visual readout.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span><strong>Full Keyboard Navigation:</strong> Global shortcuts [Space, M, ArrowKeys, 1-5, ?] and clear focus rings.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span><strong>Reduced Motion Support:</strong> Automatically softens animations for users with vestibular sensitivities.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span><strong>High-Contrast Typography:</strong> Optimized Barlow Condensed, IBM Plex Sans, and IBM Plex Mono meeting 4.5:1 ratio.</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Global Observatory Footer */}
        <div className="pt-10 border-t border-[#252D36] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#E9EDF0]/50">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#FF5938]" />
            <span>PRITHVI • AN EARTH OBSERVATORY • MULTIVERSE VENDHAN • NASA SPACE APPS 2026</span>
          </div>
          <span>BUILT WITH THREE.JS • REACT THREE FIBER • TONE.JS • GSAP • TAILWIND V4</span>
        </div>
      </div>
    </section>
  );
};
