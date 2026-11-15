import React, { useRef, useState } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { gsap, useGSAP } from '../../lib/gsap';
import { Binary, Brain, Layers, Music, Sliders, Volume2, Sparkles } from 'lucide-react';
import { sonificationCore } from '../../audio/sonification';
import { useObservatoryStore } from '../../store/useObservatoryStore';

interface EpochAudition {
  id: '1880' | '1975' | '2026';
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
    color: '#06b6d4',
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
      'Infrared trapping emerges. Cadence accelerates to 69 BPM, harmonics brighten as carbon forcing builds.',
    color: '#f59e0b',
  },
  {
    id: '2026',
    year: 2026,
    title: 'Modern Anthropocene',
    co2: 429.2,
    anomaly: 1.45,
    frequencyHz: 415.3,
    noteName: 'G#4',
    intervalRatio: '16:15 Minor 2nd + Tritone',
    tempoBpm: 96,
    tensionScore: 0.95,
    character: 'Severe Dissonance',
    explanation:
      'Planetary stress. +1.45°C anomaly introduces a grating minor second clash and urgent 96 BPM distress heartbeat.',
    color: '#ef4444',
  },
];

export const SoundToScienceSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeEpochId, setActiveEpochId] = useState<'1880' | '1975' | '2026'>('1880');
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
      icon: <Brain className="w-5 h-5 text-cyan-400" />,
      title: 'Human Auditory Temporal Resolution',
      description:
        'The human ear processes temporal transients up to 10× faster than visual saccades. Sonification allows researchers to perceive rapid acceleration and multi-decadal phase changes simultaneously.',
    },
    {
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      title: 'Polyphonic Multi-Variable Tracking',
      description:
        'While 2D visual charts suffer from visual clutter when plotting 5+ dimensions, the human auditory cortex effortlessly segregates independent sound streams (e.g. listening to bass, melody, and rhythm together).',
    },
    {
      icon: <Binary className="w-5 h-5 text-rose-400" />,
      title: 'Calibrated Deterministic Mapping',
      description:
        'Every sound generated in PRITHVI is mathematically bound to empirical NASA observations. There are no randomized embellishments or arbitrary synthesizer presets.',
    },
    {
      icon: <Music className="w-5 h-5 text-emerald-400" />,
      title: 'Psychoacoustic Consonance vs Dissonance',
      description:
        'Equilibrium conditions (pre-industrial 280 ppm, 0°C anomaly) resolve into pure harmonic fifths. Climate stress introduces minor seconds and tritones, triggering natural biological tension.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="science"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] z-10"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          number="06"
          category="ACOUSTIC EPISTEMOLOGY"
          title="SOUND-TO-SCIENCE: THE MECHANICS OF AUDITORY DISPLAY"
          subtitle="Why sonification? Acoustic data analysis uncovers hidden temporal cycles and interdependencies across Earth system components that 2D static visual graphs cannot convey."
          badge="SCIENTIFIC METHOD"
        />

        {/* 4 Core Scientific Sonification Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {principles.map((p, idx) => (
            <Panel key={idx} className="science-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 border border-white/10 bg-white/[0.02]">
                    {p.icon}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {p.title}
                  </h3>
                </div>
                <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </Panel>
          ))}
        </div>

        {/* Mathematical Formulation Showcase */}
        <Panel className="border-cyan-500/20 bg-cyan-950/10">
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <Sliders className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-widest">
              DETERMINISTIC TRANSFER EQUATIONS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-mono">
            <div className="p-4 bg-black/40 border border-white/5 space-y-2">
              <span className="text-slate-400 block text-[11px]">// 01 THERMAL FREQUENCY EQUATION</span>
              <div className="text-cyan-300 text-sm font-semibold">
                f(ΔT) = 220 · 2^(ΔT / 1.2) [Hz]
              </div>
              <p className="text-slate-400 font-sans text-xs leading-normal">
                Maps GISTEMP global temperature deviation (ΔT) to fundamental frequency. Each +1.2°C anomaly doubles the pitch octave.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 space-y-2">
              <span className="text-slate-400 block text-[11px]">// 02 CARBON CADENCE EQUATION</span>
              <div className="text-amber-300 text-sm font-semibold">
                BPM(CO₂) = 48 · (CO₂ / 280)^1.4 [Beats/Min]
              </div>
              <p className="text-slate-400 font-sans text-xs leading-normal">
                Accelerates the subterranean membrane pulse rate from a calm 48 BPM pre-industrial heartbeat to an urgent 96 BPM at present-day levels.
              </p>
            </div>
          </div>
        </Panel>

        {/* Interactive Psychoacoustic Harmonic Lab */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-white/[0.08] gap-2">
            <div>
              <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                INTERACTIVE PSYCHOACOUSTIC HARMONIC AUDITION LAB
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                Hear the Acoustic Shift: Equilibrium vs Planetary Strain
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              CLICK ANY EPOCH TO AUDITION SYNTHESIZED HARMONICS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDITION_EPOCHS.map((epoch) => {
              const isActive = activeEpochId === epoch.id;
              return (
                <Panel
                  key={epoch.id}
                  className={`flex flex-col justify-between transition-all duration-300 border ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 border" style={{ borderColor: epoch.color, color: epoch.color }}>
                        {epoch.year} EPOCH
                      </span>
                      <Badge variant={epoch.tensionScore > 0.5 ? 'crimson' : epoch.tensionScore > 0.2 ? 'amber' : 'cyan'}>
                        {epoch.character}
                      </Badge>
                    </div>

                    <h4 className="font-display text-lg font-bold text-white mb-2">
                      {epoch.title}
                    </h4>

                    <p className="font-sans text-xs text-slate-300 leading-relaxed mb-4">
                      {epoch.explanation}
                    </p>

                    <div className="p-3 bg-black/50 border border-white/5 space-y-2 font-mono text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Atmospheric CO₂:</span>
                        <span className="text-white font-bold">{epoch.co2} ppm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Temp Anomaly:</span>
                        <span className="text-white font-bold">{epoch.anomaly > 0 ? `+${epoch.anomaly}` : epoch.anomaly}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pitch & Note:</span>
                        <span className="text-cyan-300 font-bold">{epoch.frequencyHz} Hz ({epoch.noteName})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Harmonic Ratio:</span>
                        <span className="text-solar-gold font-bold">{epoch.intervalRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pulse Cadence:</span>
                        <span className="text-emerald-400 font-bold">{epoch.tempoBpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isActive ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleAuditionEpoch(epoch)}
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                    className="w-full"
                  >
                    {isActive ? `PLAYING ${epoch.year} HARMONIC` : `AUDITION ${epoch.year} FREQUENCY`}
                  </Button>
                </Panel>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
