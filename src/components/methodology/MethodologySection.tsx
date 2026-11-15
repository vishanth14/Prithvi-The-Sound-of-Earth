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
      id="methodology"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] z-10"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="07"
          category="METHODOLOGY & CREDITS"
          title="SOURCES, SCIENTIFIC CITATIONS & PROJECT INFORMATION"
          subtitle="PRITHVI is built upon open NASA Earth observation data architectures, honoring rigorous open-science principles and multimodal accessibility."
          badge="OPEN SCIENCE CITATIONS"
        />

        {/* Open Science Data Export Action Banner */}
        <Panel className="mb-12 border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 border border-cyan-400/30 bg-cyan-900/30 text-cyan-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                Download Calibrated Earth Observations (CSV)
              </h3>
              <p className="font-sans text-xs text-slate-300">
                Export all validated NASA EIC multi-decadal time-series (GISTEMP, Mauna Loa CO₂, PO.DAAC Sea Level, GEOS Aerosols, VIIRS Radiance) for independent research or evaluation.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleExportCsv}
            disabled={isExporting}
            icon={<Download className="w-4 h-4" />}
            className="shrink-0 w-full sm:w-auto"
          >
            {isExporting ? 'GENERATING CSV...' : 'EXPORT OBSERVATIONS (CSV)'}
          </Button>
        </Panel>

        {/* Scientific Sources Grid */}
        <div className="space-y-4 mb-16">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest block mb-2">
            OFFICIAL SCIENTIFIC DATA REPOSITORIES:
          </span>

          {sources.map((s, idx) => (
            <Panel
              key={idx}
              className="source-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-display font-semibold text-sm sm:text-base text-white">
                    {s.title}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-400">{s.agency}</p>
                <p className="font-sans text-xs text-slate-300 italic">{s.citation}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyCitation(s.citation, idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  title="Copy BibTeX / APA citation to clipboard"
                >
                  {copiedCitationIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>COPY CITATION</span>
                    </>
                  )}
                </button>

                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400 hover:text-cyan-300 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <span>DATA ARCHIVE</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Panel>
          ))}
        </div>

        {/* Space Apps Mission Information & Accessibility Statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/[0.08] mb-12">
          <Panel className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-cyan-400">
                <Award className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-widest">
                  CHALLENGE PARTICIPATION
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                NASA Space Apps Challenge 2026
              </h3>
              <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                <strong>Challenge:</strong> The Earth Information Jukebox<br />
                <strong>Team:</strong> MULTIVERSE VENDHAN<br />
                <strong>Project:</strong> PRITHVI — The Sound of Earth
              </p>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Created to empower citizens, educators, and scientists to listen to planetary health
                and engage with NASA's Earth System Observatory through sound and spatial graphics.
              </p>
            </div>
          </Panel>

          <Panel className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-widest">
                  MULTIMODAL ACCESSIBILITY
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                WCAG 2.2 AA Conformance
              </h3>
              <div className="space-y-2 text-xs font-sans text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Visual-to-Audio Equivalence:</strong> Every acoustic parameter has a real-time numeric and visual readout.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Full Keyboard Navigation:</strong> Global shortcuts [Space, M, ArrowKeys, 1-5, ?] and clear focus rings.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Reduced Motion Support:</strong> Automatically softens animations for users with vestibular sensitivities.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>High-Contrast Typography:</strong> Optimized IBM Plex Mono, Inter, and Space Grotesk meeting 4.5:1 ratio.</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Global Observatory Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>PRITHVI // NASA SPACE APPS 2026 // MULTIVERSE VENDHAN</span>
          </div>
          <span>BUILT WITH THREE.JS • REACT THREE FIBER • TONE.JS • GSAP • TAILWIND V4</span>
        </div>
      </div>
    </section>
  );
};
