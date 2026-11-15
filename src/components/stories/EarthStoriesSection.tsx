import React, { useState, useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import type { EicDatasetKey } from '../../data/eicSchemas';
import { gsap, useGSAP } from '../../lib/gsap';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Headphones,
  Sparkles,
  Layers,
  Activity,
  Quote,
} from 'lucide-react';

interface EditorialStory {
  id: string;
  eicKey: EicDatasetKey;
  number: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  investigatorQuote: string;
  investigatorName: string;
  investigatorTitle: string;
  bodyParagraphs: string[];
  keyTelemetry: {
    baselineLabel: string;
    baselineValue: string;
    midpointLabel: string;
    midpointValue: string;
    modernLabel: string;
    modernValue: string;
  };
  sonicCharacteristics: {
    pitchMapping: string;
    tempoMapping: string;
    timbreType: string;
    dissonanceMeaning: string;
  };
  nasaSource: string;
  themeColor: string;
}

const EDITORIAL_STORIES: EditorialStory[] = [
  {
    id: 'thermal-spiral',
    eicKey: 'gistemp',
    number: '01',
    eyebrow: 'GLOBAL SURFACE TEMPERATURE // GISTEMP V4',
    headline: 'The Thermal Spiral: Breaking the Pre-Industrial Baseline',
    subheadline:
      '+1.45°C Global Surface Anomaly Over 147 Years of Calibrated Instrumental Records',
    investigatorQuote:
      'We are not observing routine fluctuations. The rate of global thermal ascent since 1970 is without precedent in the entire Holocene epoch.',
    investigatorName: 'Dr. Gavin Schmidt',
    investigatorTitle: 'Director, NASA Goddard Institute for Space Studies (GISS)',
    bodyParagraphs: [
      'In 1880, as the Industrial Revolution expanded coal-fired manufacturing across the Northern Hemisphere, global land-ocean temperatures hovered -0.16°C below the mid-20th-century mean. For nearly a century, natural volcanic aerosols and ocean thermal inertia dampened runaway warming.',
      'By 1975, the balance ruptured. As greenhouse gas radiative forcing overtook aerosol cooling, each successive decade registered higher global surface temperatures than the last. In 2015, the planet crossed the +1.0°C anomaly threshold. In 2026, empirical measurements confirm a sustained +1.45°C anomaly, approaching the critical +1.5°C Paris Agreement limit.',
      'In the sonic domain, this century-and-a-half trajectory translates into a rising polyphonic octave ascent. The tranquil D3 (146.8 Hz) harmonic fifth of 1880 shifts inexorably toward a sharp, dissonant G#4 (415.3 Hz) minor second, rendering thermal planetary stress directly audible.',
    ],
    keyTelemetry: {
      baselineLabel: '1880 Baseline',
      baselineValue: '-0.16°C',
      midpointLabel: '1975 Acceleration',
      midpointValue: '0.00°C',
      modernLabel: '2026 Present',
      modernValue: '+1.45°C',
    },
    sonicCharacteristics: {
      pitchMapping: 'f(ΔT) = 220 · 2^(ΔT / 1.2) [D3 to G#4]',
      tempoMapping: 'Coupled to thermal escalation velocity',
      timbreType: 'Dual-oscillator triangle + dynamic 24dB low-pass filter',
      dissonanceMeaning: 'Higher anomalies inject grating minor-second intervals',
    },
    nasaSource: 'NASA Goddard Institute for Space Studies (GISS) / SVS #4976',
    themeColor: '#D1B77D',
  },
  {
    id: 'carbon-inhalation',
    eicKey: 'co2_maunaloa',
    number: '02',
    eyebrow: 'ATMOSPHERIC GREENHOUSE GASES // MAUNA LOA OBSERVATORY',
    headline: 'The Keeling Sawtooth: The Troposphere Under Stress',
    subheadline:
      'From 280 ppm Pre-Industrial Equilibrium to 429.2 ppm Anthropocene Atmospheric Burden',
    investigatorQuote:
      'Every spring, the northern forests draw down billions of tons of carbon dioxide. But each autumn, the exhale leaves a higher residual layer than ever before.',
    investigatorName: 'Dr. Ralph Keeling',
    investigatorTitle: 'Director, Scripps CO₂ Program / NOAA Global Monitoring',
    bodyParagraphs: [
      'Perched at 3,397 meters on the volcanic slope of Mauna Loa, Hawaii, the continuous Keeling monitoring station has recorded the composition of Earth’s atmosphere since 1958. Free from local vegetation and human contamination, it captures the raw, unfiltered breath of the living planet.',
      'The data reveal an intricate dual reality: an annual sawtooth oscillation created by Northern Hemisphere deciduous forests photosynthesizing in spring and respirating in autumn, overlaid on an exponential upward trajectory driven by fossil fuel combustion and land-use change.',
      'When sonified, this atmospheric burden becomes the rhythmic pacemaker of PRITHVI. While 280 ppm corresponds to a calm human resting pulse of 48 BPM, 429.2 ppm drives a tense, urgent 96 BPM cardiovascular acceleration—a literal acoustic vital sign of biospheric stress.',
    ],
    keyTelemetry: {
      baselineLabel: 'Pre-Industrial',
      baselineValue: '280.0 ppm',
      midpointLabel: '1958 Keeling Start',
      midpointValue: '315.7 ppm',
      modernLabel: '2026 Present',
      modernValue: '429.2 ppm',
    },
    sonicCharacteristics: {
      pitchMapping: 'Deep sub-bass membrane resonance (45.0 – 90.0 Hz)',
      tempoMapping: 'BPM = 48 · (CO₂ / 280)^1.4 [48 to 96 BPM]',
      timbreType: 'Acoustic sub-bass kick + resonant analog filter envelope',
      dissonanceMeaning: 'Urgent rhythmic compression reflecting accumulation rate',
    },
    nasaSource: 'NOAA Global Monitoring Laboratory & NASA OCO-2 Science Team',
    themeColor: '#E16D54',
  },
  {
    id: 'rising-tides',
    eicKey: 'sealevel_podaac',
    number: '03',
    eyebrow: 'OCEAN SURFACE TOPOGRAPHY // PO.DAAC ALTIMETRY',
    headline: 'The Swelling Oceans: Steric Expansion and Mass Transfer',
    subheadline:
      '+116.8 mm Global Mean Sea Level Rise Documented Across 33 Years of Space Radar',
    investigatorQuote:
      'The oceans are absorbing more than 90 percent of the excess heat trapped by greenhouse gases. As water warms, it expands; as ice melts, mass is transferred.',
    investigatorName: 'Dr. Josh Willis',
    investigatorTitle: 'Oceanographer & Project Scientist, NASA JPL / Sentinel-6',
    bodyParagraphs: [
      'Since the launch of the TOPEX/Poseidon radar altimeter in 1992, followed by Jason-1, Jason-2, Jason-3, and now Sentinel-6 Michael Freilich, space agencies have measured the height of the world ocean with sub-millimeter precision.',
      'The sea level record reflects two fundamental physical processes: steric thermal expansion (warmer water occupies greater physical volume) and barystatic mass addition (the runoff of billions of tons of meltwater from Greenland, Antarctica, and mountain glaciers).',
      'In PRITHVI’s acoustic architecture, ocean swelling is manifested as a dynamic, rolling hydrodynamic bandpass filter sweep. As sea level rises from 0 mm in 1993 to +116.8 mm today, the resonant frequency opens from a muffled 120 Hz depth into a bright, rushing 2,400 Hz oceanic swell.',
    ],
    keyTelemetry: {
      baselineLabel: '1993 Altimetry Baseline',
      baselineValue: '0.0 mm',
      midpointLabel: '2010 Acceleration',
      midpointValue: '+52.4 mm',
      modernLabel: '2026 Present',
      modernValue: '+116.8 mm',
    },
    sonicCharacteristics: {
      pitchMapping: 'Sub-harmonic oceanic resonance (120 Hz – 2.4 kHz)',
      tempoMapping: 'Hydrodynamic wave cycle modulated by annual tidal harmonic',
      timbreType: 'Hydrodynamic brown noise through 4-pole resonant bandpass',
      dissonanceMeaning: 'Widening bandwidth expressing planetary thermal storage',
    },
    nasaSource: 'NASA Physical Oceanography DAAC (PO.DAAC) & CNES / EUMETSAT',
    themeColor: '#508CA4',
  },
  {
    id: 'atmospheric-veil',
    eicKey: 'aerosols_geos',
    number: '04',
    eyebrow: 'AEROSOL OPTICAL DEPTH // GEOS-FP ASSIMILATION',
    headline: 'The Atmospheric Veil: Wildfire Smoke and Particulate Transport',
    subheadline:
      'Global Chemical Transport Modeling Tracking Trans-Continental Particulate Extinction',
    investigatorQuote:
      'Megafires in Canada and the Siberian taiga now inject smoke directly into the lower stratosphere, circling the globe in a matter of days.',
    investigatorName: 'Dr. Arlindo da Silva',
    investigatorTitle: 'Atmospheric Scientist, NASA Global Modeling and Assimilation Office',
    bodyParagraphs: [
      'Using high-resolution spectroradiometers on NASA’s Terra and Aqua spacecraft alongside the GEOS Forward Processing (GEOS-FP) assimilation system, scientists track the optical depth of airborne particulates across every atmospheric layer.',
      'Aerosols represent the great atmospheric counterweight: while greenhouse gases warm the planet, sulfate aerosols and mineral dust reflect solar radiation back into space. Concurrently, black carbon and megafire smoke absorb sunlight, heating atmospheric layers while hazardous particulates degrade surface air quality.',
      'Auditorily, aerosol density is transformed into a shimmering granular cloud of frequency-modulated metallic overtones. Elevated Aerosol Optical Depth (>0.4 AOD) triggers complex, microtonal inharmonic modulations that mimic the particulate turbulence of the sky.',
    ],
    keyTelemetry: {
      baselineLabel: 'Pristine Atmosphere',
      baselineValue: '< 0.08 AOD',
      midpointLabel: 'Global Mean Average',
      midpointValue: '0.174 AOD',
      modernLabel: 'Megafire Plume Event',
      modernValue: '> 0.650 AOD',
    },
    sonicCharacteristics: {
      pitchMapping: 'Crystalline FM synthesis overtones (329.6 – 493.9 Hz)',
      tempoMapping: 'Granular cloud rate coupled to atmospheric transport velocity',
      timbreType: 'Metallic FM oscillator with dynamic modulation index',
      dissonanceMeaning: 'High particulate loading produces turbulent microtonality',
    },
    nasaSource: 'NASA Global Modeling and Assimilation Office (GMAO) / MODIS',
    themeColor: '#9D8DF1',
  },
  {
    id: 'nocturnal-footprint',
    eicKey: 'nightlights_viirs',
    number: '05',
    eyebrow: 'NOCTURNAL RADIANCE // VIIRS DAY-NIGHT BAND',
    headline: 'Humanity at Night: Nocturnal Radiance and Energy Footprints',
    subheadline:
      'Calibrated Suomi NPP VIIRS Radiance Illuminating Urban Expansion and Grid Resilience',
    investigatorQuote:
      'At night, the Earth ceases to look like a physical planet and begins to look like a living neural network of human civilization.',
    investigatorName: 'Dr. Miguel Román',
    investigatorTitle: 'Lead Scientist, NASA Black Marble Team / ESDS',
    bodyParagraphs: [
      'The Visible Infrared Imaging Radiometer Suite (VIIRS) aboard the Suomi NPP satellite captures nocturnal anthropogenic light emissions across the planet with revolutionary calibration. Through the NASA Black Marble suite, lunar reflectance and atmospheric interference are stripped away to reveal true artificial luminescence.',
      'These nocturnal signatures track the pulse of human civilization: the rapid electrification of developing regions, the immense power grids of megacities, offshore fishing fleets illuminating open oceans, and the sudden darkness of electrical grids disabled by severe tropical cyclones.',
      'In PRITHVI, night-time radiance is expressed as a warm, contemplative polyphonic synthesizer pad. Pentatonic intervals represent balanced electrification, while localized blackout events produce subtle harmonic falloffs and muted low-pass filtering.',
    ],
    keyTelemetry: {
      baselineLabel: 'Dark Rural Baseline',
      baselineValue: '0.8 nW',
      midpointLabel: 'Suburban Electrification',
      midpointValue: '18.4 nW',
      modernLabel: 'Urban Megaregion',
      modernValue: '124.6 nW',
    },
    sonicCharacteristics: {
      pitchMapping: 'Warm analog synthesizer pad chord (261.6 – 392.0 Hz)',
      tempoMapping: 'Slow contemplative ambient envelope with 4-second sustain',
      timbreType: 'Dual sawtooth + warm chorus with soft attack envelope',
      dissonanceMeaning: 'Consonant pentatonic chords reflecting urban connectivity',
    },
    nasaSource: 'NASA Earth Science Data Systems (ESDS) Black Marble HD Suite',
    themeColor: '#4EBA97',
  },
];

export const EarthStoriesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number>(0);
  const { setActiveEicKey, isAudioUnlocked, unlockAudio, startPlayback } =
    useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.story-reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  const activeStory = EDITORIAL_STORIES[activeStoryIdx];

  const handleAuditionStory = async (eicKey: EicDatasetKey) => {
    await setActiveEicKey(eicKey);
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await startPlayback();

    const jukeboxEl =
      document.getElementById('jukebox') ||
      document.getElementById('eic-jukebox') ||
      document.getElementById('sonification');
    if (jukeboxEl) {
      jukeboxEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="stories"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="story-reveal">
          <SectionHeader
            number="03"
            category="EDITORIAL SCIENTIFIC STORIES"
            title="WHAT EARTH IS TELLING US"
            subtitle="Five multi-decadal planetary narratives derived from empirical NASA Earth Information Center observations. Each story chronicles a critical transformation in Earth's biosphere, atmosphere, and oceans—translated into narrative prose and acoustic harmony."
            badge="VERIFIED EIC NARRATIVES"
            badgeVariant="sand"
          />
        </div>

        {/* Story Selector Carousel Tab Bar */}
        <div className="story-reveal flex flex-wrap items-center gap-2 pb-4 border-b border-[#F0EEE5]/10">
          <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#D1B77D]" />
            PLANETARY CHAPTERS:
          </span>
          {EDITORIAL_STORIES.map((story, idx) => {
            const isSelected = activeStoryIdx === idx;
            return (
              <button
                key={story.id}
                onClick={() => setActiveStoryIdx(idx)}
                className={`group px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 rounded-full flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_16px_rgba(240,238,229,0.15)]'
                    : 'bg-transparent text-[#F0EEE5]/60 border border-[#F0EEE5]/15 hover:border-[#D1B77D] hover:text-[#D1B77D]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: story.themeColor }}
                />
                <span className="font-mono text-[10px] opacity-70">{story.number}</span>
                <span>{story.headline.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Master Asymmetric Editorial Story Feature */}
        <div className="story-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Deep Narrative Prose (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-xs tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm"
                style={{
                  backgroundColor: `${activeStory.themeColor}15`,
                  color: activeStory.themeColor,
                  border: `1px solid ${activeStory.themeColor}40`,
                }}
              >
                {activeStory.eyebrow}
              </span>
              <span className="text-xs font-mono text-[#F0EEE5]/40">•</span>
              <span className="font-mono text-xs text-[#F0EEE5]/60 tracking-wider">
                {activeStory.nasaSource.split('/')[0]}
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F0EEE5] leading-[1.1] tracking-tight">
              {activeStory.headline}
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#D1B77D] font-medium tracking-wide">
              {activeStory.subheadline}
            </p>

            {/* Scientific Investigator Pull-Quote */}
            <div className="p-6 border-l-2 bg-[#0C1017] border-[#D1B77D] rounded-r-sm my-2">
              <Quote className="w-5 h-5 text-[#D1B77D] mb-2 opacity-60" />
              <p className="font-serif italic text-base sm:text-lg text-[#F0EEE5]/90 leading-relaxed mb-3">
                &ldquo;{activeStory.investigatorQuote}&rdquo;
              </p>
              <div className="text-xs font-mono text-[#D1B77D]">
                — {activeStory.investigatorName},{' '}
                <span className="text-[#F0EEE5]/60">{activeStory.investigatorTitle}</span>
              </div>
            </div>

            {/* Story Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base font-sans text-[#F0EEE5]/80 leading-relaxed font-light">
              {activeStory.bodyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Audio Bridge CTA */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAuditionStory(activeStory.eicKey)}
                icon={<Headphones className="w-4 h-4 text-[#111820]" />}
              >
                AUDITION THIS STORY IN THE JUKEBOX
              </Button>

              <span className="text-xs font-mono text-[#F0EEE5]/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D1B77D]" />
                Direct deterministic synthesis link
              </span>
            </div>
          </div>

          {/* Right Column: Key Telemetry & Acoustic Transfer Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Telemetry Evolution Card */}
            <Panel className="bg-[#0C1017] border-[#F0EEE5]/10 p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#D1B77D]" />
                  EMPIRICAL TIMELINE TELEMETRY
                </span>
                <Badge variant="sand">NASA EIC DATA</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                  <span className="font-mono text-[10px] text-[#F0EEE5]/50 uppercase block mb-1">
                    {activeStory.keyTelemetry.baselineLabel}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-[#F0EEE5]">
                    {activeStory.keyTelemetry.baselineValue}
                  </span>
                </div>

                <div className="p-3 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                  <span className="font-mono text-[10px] text-[#D1B77D] uppercase block mb-1">
                    {activeStory.keyTelemetry.midpointLabel}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-[#D1B77D]">
                    {activeStory.keyTelemetry.midpointValue}
                  </span>
                </div>

                <div className="p-3 bg-[#111820] border border-[#E16D54]/40 rounded-sm">
                  <span className="font-mono text-[10px] text-[#E16D54] uppercase block mb-1">
                    {activeStory.keyTelemetry.modernLabel}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-[#E16D54]">
                    {activeStory.keyTelemetry.modernValue}
                  </span>
                </div>
              </div>
            </Panel>

            {/* Acoustic Mapping Explanation Card */}
            <Panel className="bg-[#0C1017] border-[#F0EEE5]/10 p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 text-[#D1B77D]" />
                  ACOUSTIC TRANSFER LOGIC
                </span>
                <Badge variant="signal">REAL-TIME TONE</Badge>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-[#F0EEE5]/50 block mb-0.5">Pitch Transfer:</span>
                  <span className="text-[#F0EEE5] font-semibold">
                    {activeStory.sonicCharacteristics.pitchMapping}
                  </span>
                </div>

                <div>
                  <span className="text-[#F0EEE5]/50 block mb-0.5">Tempo Cadence:</span>
                  <span className="text-[#D1B77D] font-semibold">
                    {activeStory.sonicCharacteristics.tempoMapping}
                  </span>
                </div>

                <div>
                  <span className="text-[#F0EEE5]/50 block mb-0.5">Timbre Engine:</span>
                  <span className="text-[#F0EEE5]/80">
                    {activeStory.sonicCharacteristics.timbreType}
                  </span>
                </div>

                <div>
                  <span className="text-[#F0EEE5]/50 block mb-0.5">Dissonance Meaning:</span>
                  <span className="text-[#E16D54]/90 font-sans italic text-[11px]">
                    {activeStory.sonicCharacteristics.dissonanceMeaning}
                  </span>
                </div>
              </div>
            </Panel>

            {/* Official Source Provenance */}
            <div className="p-4 border border-[#F0EEE5]/10 bg-[#0C1017] rounded-sm text-xs font-mono text-[#F0EEE5]/60 flex items-center justify-between">
              <div>
                <span className="text-[#F0EEE5]/40 block text-[10px]">OFFICIAL PROVENANCE:</span>
                <span className="text-[#F0EEE5]">{activeStory.nasaSource}</span>
              </div>
              <Badge variant="neutral">OPEN DATA</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
