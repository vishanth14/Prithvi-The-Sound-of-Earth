import React, { useRef, useState } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { gsap, useGSAP } from '../../lib/gsap';
import { Binary, Brain, Layers, Music, Sliders, Volume2, Sparkles } from 'lucide-react';
import { sonificationCore } from '../../audio/sonification';
import { useObservatoryStore } from '../../store/useObservatoryStore';

interface EpochAudition {
  id: '1880' | '1975' | '2024';
  year: number;
  title: string;
  co2: number;
  anomaly: number;
  frequencyHz: number;
  noteName: string;
  intervalRatio: string;
  tempoBpm: number;
  tensionScore: number;
  character: string;
  explanation: string;
  color: string;
}

const AUDITION_EPOCHS: EpochAudition[] = [
  {
    id: '1880',
    year: 1880,
    title: 'Pre-Industrial Equilibrium',
    co2: 280.0,
    anomaly: -0.16,
    frequencyHz: 146.8,
    noteName: 'D3',
    intervalRatio: '3:2 Perfect 5th',
    tempoBpm: 48,
    tensionScore: 0.0,
    character: 'Harmonic Resolution',
    explanation:
      'Equilibrium state. Fundamental tone pairs with a natural 3:2 harmonic fifth and serene 48 BPM biological resting pulse.',
    color: '#83BBD5',
  },
  {
    id: '1975',
    year: 1975,
    title: 'Mid-Century Acceleration',
    co2: 331.1,
    anomaly: 0.0,
    frequencyHz: 196.0,
    noteName: 'G3',
    intervalRatio: '5:4 Major 3rd',
    tempoBpm: 69,
    tensionScore: 0.35,
    character: 'Developing Tension',
    explanation:
      'Infrared trapping emerges. Cadence accelerates to 69 BPM, harmonics brighten as carbon radiative forcing builds.',
    color: '#252D36',
  },
  {
    id: '2024',
    year: 2024,
    title: 'Modern Anthropocene Benchmark',
    co2: 424.3,
    anomaly: 1.28,
    frequencyHz: 392.0,
    noteName: 'G4',
    intervalRatio: '16:15 Minor 2nd + Tritone',
    tempoBpm: 92,
    tensionScore: 0.90,
    character: 'Severe Dissonance',
    explanation:
      'Planetary stress. +1.28°C empirical GISTEMP anomaly and 424.3 ppm Mauna Loa CO₂ introduce a grating minor second clash and urgent 92 BPM distress heartbeat.',
    color: '#FF5938',
  },
];

export const SoundToScienceSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeEpochId, setActiveEpochId] = useState<'1880' | '1975' | '2024'>('1880');
  const { isAudioUnlocked, unlockAudio } = useObservatoryStore();

  const handleAuditionEpoch = async (epoch: EpochAudition) => {
    setActiveEpochId(epoch.id);
    if (!isAudioUnlocked) {
      await unlockAudio();
    }

    await sonificationCore.playMeasurement({
      frequencyHz: epoch.frequencyHz,
      noteName: epoch.noteName,
      centsOffset: 0,
      gain: 0.8,
      velocity: 0.85,
      durationSeconds: 1.2,
      durationTone: '2n',
      stepIntervalMs: Math.round(60000 / epoch.tempoBpm),
      tempoBpm: epoch.tempoBpm,
      timbreType: 'thermalSynth',
      harmonicity: 1.5,
      modulationIndex: epoch.tensionScore > 0.5 ? 1.4 : 0.2,
      filterCutoffHz: epoch.id === '1880' ? 350 : epoch.id === '1975' ? 700 : 2100,
      explanation: {
        datasetTitle: epoch.title,
        rawMeasurement: `${epoch.co2} ppm / ${epoch.anomaly}°C`,
        baselineComparison: 'Pre-industrial 1880 standard',
        rateOfChangeMetric: `${epoch.tempoBpm} BPM`,
        pitchFormula: 'f(ΔT) = 220 · 2^(ΔT/1.2)',
        rhythmFormula: 'BPM = 48 · (CO2/280)^1.4',
        intensityFormula: 'Spectral Cutoff Dynamic',
        dissonanceInterpretation: epoch.character,
      },
    });
  };

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.science-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  const principles = [
    {
      icon: <Brain className="w-5 h-5 text-[#FF5938]" />,
      title: 'Human Auditory Temporal Resolution',
      description:
        'The human ear processes temporal transients up to 10× faster than visual saccades. Sonification allows researchers to perceive rapid acceleration and multi-decadal phase shifts simultaneously.',
    },
    {
      icon: <Layers className="w-5 h-5 text-[#83BBD5]" />,
      title: 'Polyphonic Multi-Variable Tracking',
      description:
        'While 2D visual charts suffer from severe clutter when plotting 5+ dimensions, the human auditory cortex effortlessly segregates independent sound streams into distinct harmonic components.',
    },
    {
      icon: <Binary className="w-5 h-5 text-[#FF5938]" />,
      title: 'Calibrated Deterministic Mapping',
      description:
        'Every sound synthesized in PRITHVI is mathematically bound to empirical NASA observations. There are zero randomized embellishments, generative hallucinations, or arbitrary synthesizer presets.',
    },
    {
      icon: <Music className="w-5 h-5 text-[#83BBD5]" />,
      title: 'Psychoacoustic Consonance vs Dissonance',
      description:
        'Equilibrium conditions (pre-industrial 280 ppm, 0°C anomaly) resolve into pure harmonic fifths. Climate stress introduces minor seconds and tritones, triggering natural biological urgency.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="signal"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[rgba(7,11,16,0.15)] z-10 bg-[#E9EDF0] text-[#070B10]"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <SectionHeader
          number="05"
          category="MATHEMATICAL SONIFICATION"
          title="UNDERSTAND THE SIGNAL"
          subtitle="The mathematical mapping, transfer equations, psychoacoustic logic, and scientific limitations converting empirical NASA measurements into deterministic sound. Every frequency, harmonic ratio, and rhythmic pulse exists for a verifiable physical reason."
          badge="MATHEMATICAL RIGOR"
          badgeVariant="signal"
          theme="light"
        />

        {/* 4 Core Scientific Sonification Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="science-card flex flex-col justify-between bg-white border border-[rgba(7,11,16,0.12)] p-7 rounded-none shadow-[0_4px_24px_rgba(7,11,16,0.04)]"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="p-2.5 border border-[rgba(7,11,16,0.12)] bg-[#E9EDF0] rounded-none">
                    {p.icon}
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-[#070B10]">
                    {p.title}
                  </h3>
                </div>
                <p className="font-sans text-xs sm:text-sm text-[#252D36]/80 leading-relaxed font-normal">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mathematical Formulation Showcase */}
        <div className="border border-[rgba(7,11,16,0.15)] bg-white p-7 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(7,11,16,0.04)]">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[rgba(7,11,16,0.1)] text-[#FF5938]">
            <Sliders className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
              DETERMINISTIC TRANSFER EQUATIONS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#E9EDF0] border border-[rgba(7,11,16,0.1)] space-y-2 rounded-none">
              <span className="text-[#FF5938] block text-[11px] uppercase tracking-wider font-bold">
                // 01 THERMAL FREQUENCY
              </span>
              <div className="text-[#070B10] text-sm font-bold font-mono">
                f(ΔT) = 220 · 2^(ΔT / 1.2)
              </div>
              <p className="text-[#252D36]/80 font-sans text-xs leading-relaxed font-normal">
                Unit: Hz. Maps GISTEMP temperature anomaly. Each +1.2°C anomaly doubles the pitch octave.
              </p>
            </div>

            <div className="p-4 bg-[#E9EDF0] border border-[rgba(7,11,16,0.1)] space-y-2 rounded-none">
              <span className="text-[#FF5938] block text-[11px] uppercase tracking-wider font-bold">
                // 02 CARBON CADENCE
              </span>
              <div className="text-[#070B10] text-sm font-bold font-mono">
                BPM = 48 · (CO₂ / 280)^1.4
              </div>
              <p className="text-[#252D36]/80 font-sans text-xs leading-relaxed font-normal">
                Unit: BPM. Accelerates the sub-bass pulse rate from 48 BPM resting pulse to 92 BPM.
              </p>
            </div>

            <div className="p-4 bg-[#E9EDF0] border border-[rgba(7,11,16,0.1)] space-y-2 rounded-none">
              <span className="text-[#83BBD5] block text-[11px] uppercase tracking-wider font-bold">
                // 03 OCEANIC RESONANCE
              </span>
              <div className="text-[#070B10] text-sm font-bold font-mono">
                fc(h) = 120 + 2280 · (h / 120)
              </div>
              <p className="text-[#252D36]/80 font-sans text-xs leading-relaxed font-normal">
                Unit: Hz. Opens resonant 4-pole bandpass filter from 120 Hz to 2,400 Hz as sea level rises.
              </p>
            </div>

            <div className="p-4 bg-[#E9EDF0] border border-[rgba(7,11,16,0.1)] space-y-2 rounded-none">
              <span className="text-[#252D36] block text-[11px] uppercase tracking-wider font-bold">
                // 04 AEROSOL MODULATION
              </span>
              <div className="text-[#070B10] text-sm font-bold font-mono">
                ModIdx = 0.2 + 2.5 · (AOD / 0.5)
              </div>
              <p className="text-[#252D36]/80 font-sans text-xs leading-relaxed font-normal">
                Unitless index. High particulate optical depth induces metallic FM inharmonicity.
              </p>
            </div>
          </div>

          {/* Scientific Limitations & Epistemological Boundaries */}
          <div className="mt-6 pt-5 border-t border-[rgba(7,11,16,0.1)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#FF5938] block mb-1 font-bold uppercase text-[10px]">
                LIMITATION 01 // NYQUIST TEMPORAL SAMPLING
              </span>
              <p className="text-[#252D36]/75 font-sans leading-relaxed font-normal">
                Annual and monthly satellite sweeps are interpolated through cubic-spline smoothing; rapid diurnal variations are abstracted to preserve long-term decadal trends.
              </p>
            </div>
            <div>
              <span className="text-[#FF5938] block mb-1 font-bold uppercase text-[10px]">
                LIMITATION 02 // DYNAMIC RANGE COMPRESSION
              </span>
              <p className="text-[#252D36]/75 font-sans leading-relaxed font-normal">
                Acoustic amplitudes are bounded between -24 dBFS and -6 dBFS through lookahead peak limiting to protect auditory comfort while preserving proportional energy ratios.
              </p>
            </div>
            <div>
              <span className="text-[#252D36] block mb-1 font-bold uppercase text-[10px]">
                LIMITATION 03 // DISCRETE SCALE QUANTIZATION
              </span>
              <p className="text-[#252D36]/75 font-sans leading-relaxed font-normal">
                Continuous physical parameters are mapped across 12-tone equal temperament micro-steps to retain musical comprehensibility without sacrificing decimal fidelity.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Psychoacoustic Harmonic Lab */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-8 border-b border-[rgba(7,11,16,0.12)] gap-3">
            <div>
              <span className="font-mono text-xs text-[#FF5938] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                INTERACTIVE PSYCHOACOUSTIC HARMONIC AUDITION LAB
              </span>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#070B10] mt-1.5 tracking-tight">
                Hear the Acoustic Shift: Equilibrium vs Planetary Strain
              </h3>
            </div>
            <span className="text-xs font-mono text-[#252D36]/70 uppercase tracking-wider font-semibold">
              CLICK ANY EPOCH TO AUDITION SYNTHESIZED HARMONICS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {AUDITION_EPOCHS.map((epoch) => {
              const isActive = activeEpochId === epoch.id;
              return (
                <div
                  key={epoch.id}
                  className={`flex flex-col justify-between transition-all duration-300 p-7 bg-white rounded-none border ${
                    isActive
                      ? 'border-[#FF5938] shadow-[0_8px_30px_rgba(255,89,56,0.2)]'
                      : 'border-[rgba(7,11,16,0.12)] hover:border-[#FF5938]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(7,11,16,0.1)]">
                      <span
                        className="font-mono text-xs font-bold px-2.5 py-0.5 border rounded-none"
                        style={{ borderColor: epoch.color, color: epoch.color }}
                      >
                        {epoch.year} EPOCH
                      </span>
                      <Badge variant={epoch.tensionScore > 0.5 ? 'signal' : epoch.tensionScore > 0.2 ? 'paper' : 'ocean'}>
                        {epoch.character}
                      </Badge>
                    </div>

                    <h4 className="font-display text-2xl font-bold uppercase text-[#070B10] mb-2 tracking-tight">
                      {epoch.title}
                    </h4>

                    <p className="font-sans text-xs sm:text-sm text-[#252D36]/80 leading-relaxed mb-5 font-normal">
                      {epoch.explanation}
                    </p>

                    <div className="p-4 bg-[#E9EDF0] border border-[rgba(7,11,16,0.1)] space-y-2.5 font-mono text-xs mb-6 rounded-none">
                      <div className="flex justify-between">
                        <span className="text-[#252D36]/60">Atmospheric CO₂:</span>
                        <span className="text-[#070B10] font-bold">{epoch.co2} ppm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#252D36]/60">Temp Anomaly:</span>
                        <span className="text-[#FF5938] font-bold">{epoch.anomaly > 0 ? `+${epoch.anomaly}` : epoch.anomaly}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#252D36]/60">Pitch & Note:</span>
                        <span className="text-[#070B10] font-bold">{epoch.frequencyHz} Hz ({epoch.noteName})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#252D36]/60">Harmonic Ratio:</span>
                        <span className="text-[#070B10] font-bold">{epoch.intervalRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#252D36]/60">Pulse Cadence:</span>
                        <span className="text-[#FF5938] font-bold">{epoch.tempoBpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isActive ? 'primary' : 'paper'}
                    size="sm"
                    onClick={() => handleAuditionEpoch(epoch)}
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                    className="w-full"
                  >
                    {isActive ? `PLAYING ${epoch.year} HARMONIC` : `AUDITION ${epoch.year} FREQUENCY`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
