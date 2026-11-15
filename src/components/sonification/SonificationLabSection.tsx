import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { sonificationCore } from '../../audio/sonification';
import { audioTransport, type TransportState, type TransportTickPayload } from '../../audio/audioTransport';
import { mapObservationToAudio } from '../../audio/dataMapping';
import { EicDataService } from '../../data/eicDataService';
import type { EicDataset, EicDatasetKey } from '../../data/eicSchemas';
import { gsap, useGSAP } from '../../lib/gsap';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Volume2,
  VolumeX,
  Sliders,
  Activity,
  Disc,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Repeat,
  Radio,
  Sparkles,
  Info,
} from 'lucide-react';

interface TrackDef {
  key: EicDatasetKey;
  name: string;
  trackLabel: string;
  nominalHz: string;
  timbreDescription: string;
  themeColor: string;
}

const EIC_TRACKS: TrackDef[] = [
  {
    key: 'gistemp',
    name: 'Thermal Anomaly (GISTEMP v4)',
    trackLabel: 'Track 01 // Thermal PolySynth',
    nominalHz: '146.8 — 739.9 Hz',
    timbreDescription: 'Dual-oscillator triangle + dynamic 24dB/oct low-pass filter',
    themeColor: '#D1B77D',
  },
  {
    key: 'co2_maunaloa',
    name: 'Carbon Clock (Mauna Loa CO₂)',
    trackLabel: 'Track 02 // Anthropocene Pulse',
    nominalHz: '45.0 — 90.0 Hz',
    timbreDescription: 'Sub-bass membrane punch with rate-coupled heartbeat',
    themeColor: '#E16D54',
  },
  {
    key: 'sealevel_podaac',
    name: 'Altimetry Swell (Sentinel-6 / PO.DAAC)',
    trackLabel: 'Track 03 // Oceanic Resonance',
    nominalHz: '120.0 — 2400.0 Hz',
    timbreDescription: 'Hydrodynamic brown noise through 4-pole resonant bandpass',
    themeColor: '#17465B',
  },
  {
    key: 'aerosols_geos',
    name: 'Aerosol Particulates (GEOS-FP Smoke)',
    trackLabel: 'Track 04 // Granular Cloud',
    nominalHz: '329.6 — 493.9 Hz',
    timbreDescription: 'Crystalline FM synthesis with metallic wildfire inharmonicity',
    themeColor: '#8B5CF6',
  },
  {
    key: 'nightlights_viirs',
    name: 'Earth at Night (VIIRS Black Marble)',
    trackLabel: 'Track 05 // Nocturnal Choral',
    nominalHz: '261.6 — 392.0 Hz',
    timbreDescription: 'Warm analog synthesizer pad with pentatonic chord spread',
    themeColor: '#10B981',
  },
];

export const SonificationLabSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    isAudioUnlocked,
    unlockAudio,
    isMuted,
    toggleMute,
    masterVolume,
    setMasterVolume,
  } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.lab-reveal', {
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

  // Component State
  const [activeKey, setActiveKey] = useState<EicDatasetKey>('gistemp');
  const [datasets, setDatasets] = useState<Record<EicDatasetKey, EicDataset> | null>(null);
  const [transportState, setTransportState] = useState<TransportState>('STOPPED');
  const [currentPayload, setCurrentPayload] = useState<TransportTickPayload | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<number[]>(new Array(48).fill(0));

  // Load empirical EIC datasets
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      const all = await EicDataService.loadAllDatasets();
      if (isMounted) {
        setDatasets(all);
        const defaultObs = all.gistemp.observations;
        audioTransport.loadSequence(defaultObs, 0);
        const params = mapObservationToAudio(defaultObs[0]);
        setCurrentPayload({
          observation: defaultObs[0],
          params,
          index: 0,
          totalRecords: defaultObs.length,
          progressPercent: 0,
        });
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to Transport events
  useEffect(() => {
    const unsubTick = audioTransport.onTick((payload) => {
      setCurrentPayload(payload);
    });

    const unsubState = audioTransport.onStateChange((state) => {
      setTransportState(state);
    });

    return () => {
      unsubTick();
      unsubState();
    };
  }, []);

  // Sync mute with synthesis core
  useEffect(() => {
    sonificationCore.setMuted(isMuted);
  }, [isMuted]);

  // Sync volume with synthesis core
  useEffect(() => {
    sonificationCore.setVolume(masterVolume);
  }, [masterVolume]);

  // Handle Track Switching
  const handleSelectTrack = useCallback(
    (key: EicDatasetKey) => {
      setActiveKey(key);
      if (!datasets) return;
      const obs = datasets[key].observations;
      const wasPlaying = transportState === 'PLAYING';
      audioTransport.loadSequence(obs, 0);
      const params = mapObservationToAudio(obs[0]);
      setCurrentPayload({
        observation: obs[0],
        params,
        index: 0,
        totalRecords: obs.length,
        progressPercent: 0,
      });

      if (wasPlaying) {
        audioTransport.play();
      }
    },
    [datasets, transportState]
  );

  // Transport Control Actions
  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (transportState === 'PLAYING') {
      audioTransport.pause();
    } else {
      await audioTransport.play();
    }
  };

  const handleStop = () => {
    audioTransport.stop();
  };

  const handleReplay = async () => {
    if (!isAudioUnlocked) await unlockAudio();
    await audioTransport.replay();
  };

  const handleSpeedChange = (mult: number) => {
    setSpeedMultiplier(mult);
    audioTransport.setSpeedMultiplier(mult);
  };

  const handleToggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    audioTransport.setIsLooping(next);
  };

  const handleScrub = (idx: number) => {
    if (!isAudioUnlocked) unlockAudio();
    audioTransport.seekToIndex(idx, true);
  };

  // Real Web Audio Oscilloscope & 48-Band FFT Loop (Warm Ink & Editorial Accents)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const currentTrack = EIC_TRACKS.find((t) => t.key === activeKey) || EIC_TRACKS[0];

    const render = () => {
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      // Deep Ink background
      ctx.fillStyle = '#080B10';
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal dB grid lines
      ctx.strokeStyle = 'rgba(240, 238, 229, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const dbMarkers = [
        { label: '-6 dB', y: height * 0.22 },
        { label: '-18 dB', y: height * 0.48 },
        { label: '-30 dB', y: height * 0.74 },
      ];
      ctx.fillStyle = 'rgba(240, 238, 229, 0.4)';
      ctx.font = '9px "IBM Plex Mono", monospace';
      dbMarkers.forEach((m) => {
        ctx.beginPath();
        ctx.moveTo(0, m.y);
        ctx.lineTo(width, m.y);
        ctx.stroke();
        ctx.fillText(m.label, 8, m.y - 3);
      });

      // Subtle vertical frequency guide lines
      const freqMarkers = [
        { label: '100 Hz', x: width * 0.22 },
        { label: '1 kHz', x: width * 0.55 },
        { label: '5 kHz', x: width * 0.85 },
      ];
      freqMarkers.forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(f.x, 0);
        ctx.lineTo(f.x, height);
        ctx.stroke();
        ctx.fillText(f.label, f.x + 4, height - 6);
      });
      ctx.setLineDash([]); // Reset line dash

      // Center zero-voltage reference line
      ctx.strokeStyle = 'rgba(209, 183, 125, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Extract real FFT data from Web Audio Analyser
      const fftData = sonificationCore.getFftData();
      const waveData = sonificationCore.getWaveformData();

      const isSynthesizing = transportState === 'PLAYING' && !isMuted;
      const barCount = Math.min(48, fftData.length);
      const barWidth = width / barCount - 2;
      const peaks = peaksRef.current;

      for (let i = 0; i < barCount; i++) {
        const rawFft = fftData[i];
        const normalizedFft = isSynthesizing ? Math.max(0, (rawFft + 100) / 100) : 0.04;
        const barHeight = Math.max(3, normalizedFft * height * 0.82);

        // Update peak decay
        peaks[i] = Math.max(barHeight, (peaks[i] || 0) * 0.94);

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient bar (Warm Editorial styling)
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(209, 183, 125, 0.08)');
        grad.addColorStop(0.65, currentTrack.themeColor);
        grad.addColorStop(1, '#F0EEE5');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak hold marker
        if (isSynthesizing && peaks[i] > 6) {
          ctx.fillStyle = '#F0EEE5';
          ctx.fillRect(x, height - peaks[i] - 1.5, barWidth, 1.5);
        }
      }

      // Draw real Web Audio time-domain waveform line
      ctx.shadowColor = currentTrack.themeColor;
      ctx.shadowBlur = isSynthesizing ? 8 : 0;
      ctx.beginPath();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = isSynthesizing ? currentTrack.themeColor : 'rgba(240, 238, 229, 0.25)';

      const waveStep = Math.max(1, Math.floor(waveData.length / width));
      for (let x = 0; x < width; x++) {
        const val = waveData[x * waveStep] || 0;
        const y = height / 2 + val * (height * 0.38);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [transportState, isMuted, activeKey]);

  const activeTrack = EIC_TRACKS.find((t) => t.key === activeKey) || EIC_TRACKS[0];
  const activeObs = currentPayload?.observation;
  const activeParams = currentPayload?.params;

  return (
    <section
      ref={sectionRef}
      id="sonification"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="lab-reveal">
          <SectionHeader
            number="04.5"
            category="ACOUSTIC SYNTHESIS LABORATORY"
            title="REAL-TIME PLANETARY SONIFICATION"
            subtitle="True real-time auditory display of empirical NASA measurements. Physical data values modulate synthesizer pitch, harmonic dissonance, and rhythmic cadence without prerecorded audio."
            badge="TONE.JS + WEB AUDIO ENGINE"
            badgeVariant="signal"
          />
        </div>

        {/* Audio Context Unlock Prompt (If Suspended) */}
        {!isAudioUnlocked && (
          <div className="lab-reveal p-5 bg-[#E16D54]/10 border border-[#E16D54]/30 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Radio className="w-5 h-5 text-[#E16D54] animate-pulse" />
              <div>
                <h4 className="font-sans font-semibold text-[#F0EEE5] text-sm uppercase tracking-wide">
                  BROWSER AUDIO SUSPENDED (AUTOPLAY POLICY)
                </h4>
                <p className="font-serif italic text-xs text-[#F0EEE5]/75">
                  Initialize the Web Audio API context to enable real-time synthesis and auditory display.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={unlockAudio}>
              UNLOCK OBSERVATORY AUDIO
            </Button>
          </div>
        )}

        {/* Master Jukebox Rack Panel */}
        <div className="lab-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Console: 5 EIC Track Channels */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
              <Disc className="w-3.5 h-3.5 text-[#D1B77D]" />
              EIC JUKEBOX CHANNELS:
            </span>

            {EIC_TRACKS.map((track) => {
              const isSelected = activeKey === track.key;
              const isPlaying = isSelected && transportState === 'PLAYING';
              return (
                <div
                  key={track.key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select ${track.name}`}
                  onClick={() => handleSelectTrack(track.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTrack(track.key);
                    }
                  }}
                  className={`p-4 border transition-all duration-200 cursor-pointer flex items-center justify-between rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D] ${
                    isSelected
                      ? 'border-[#D1B77D] bg-[#F0EEE5]/10 text-[#F0EEE5] shadow-[0_4px_16px_rgba(209,183,125,0.12)]'
                      : 'border-[#F0EEE5]/10 bg-[#0C1017] text-[#F0EEE5]/70 hover:text-[#F0EEE5] hover:border-[#D1B77D]/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Disc
                      className={`w-4 h-4 ${isPlaying ? 'animate-spin text-[#D1B77D]' : 'text-[#F0EEE5]/40'}`}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-[#D1B77D] tracking-wider uppercase">
                        {track.trackLabel}
                      </span>
                      <span className="font-serif text-base font-normal text-[#F0EEE5]">
                        {track.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-[10px] font-mono text-[#F0EEE5]/60">
                    <span className="text-[#F0EEE5] font-semibold">
                      {isSelected && activeParams ? `${activeParams.tempoBpm} BPM` : 'AUTO BPM'}
                    </span>
                    <span className="text-[#D1B77D]">{track.nominalHz}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Console: Live Waveform Visualizer & Transport Deck */}
          <Panel className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 bg-[#0C1017] border-[#F0EEE5]/10">
            <div>
              {/* Visualizer Top Bar */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EEE5]/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D1B77D]" />
                  <span className="font-mono text-xs text-[#F0EEE5] uppercase tracking-wider font-semibold">
                    LIVE SPECTRAL OSCILLOGRAM: {activeTrack.name.toUpperCase()}
                  </span>
                </div>
                <Badge
                  variant={transportState === 'PLAYING' && !isMuted ? 'signal' : 'sand'}
                  pulse={transportState === 'PLAYING'}
                >
                  {transportState === 'PLAYING' && !isMuted ? 'SYNTHESIZING LIVE' : transportState}
                </Badge>
              </div>

              {/* Waveform Canvas & Multimodal Visual Audio Activity Meter */}
              <div className="relative w-full h-44 sm:h-48 bg-[#080B10] border border-[#F0EEE5]/10 mb-4 overflow-hidden rounded-sm">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute top-2 right-2 text-[10px] font-mono text-[#F0EEE5]/60 bg-[#111820]/80 px-2 py-0.5 border border-[#F0EEE5]/10 flex items-center gap-1.5 rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E16D54] animate-ping" />
                  <span>FFT 48-BAND SPECTRUM</span>
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#D1B77D] bg-[#111820]/80 px-2 py-0.5 border border-[#F0EEE5]/10 flex items-center gap-2 rounded-sm">
                  <span>
                    {activeParams
                      ? `${activeParams.frequencyHz} Hz (${activeParams.noteName}${
                          activeParams.centsOffset > 0 ? `+${activeParams.centsOffset}¢` : ''
                        })`
                      : 'AWAITING PLAYHEAD'}
                  </span>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        transportState === 'PLAYING' && !isMuted ? activeTrack.themeColor : '#64748b',
                    }}
                    title="Audio Amplitude Indicator"
                  />
                </div>
              </div>

              {/* Screen reader live announcements for accessible sonification telemetry */}
              <div role="status" aria-live="polite" className="sr-only">
                {transportState === 'PLAYING' && activeParams
                  ? `Sonification synthesizing ${activeTrack.name}. Year ${activeObs?.year}, audio frequency ${activeParams.frequencyHz} Hertz, note ${activeParams.noteName}, cadence ${activeParams.tempoBpm} BPM.`
                  : 'Sonification standby.'}
              </div>

              {/* Live Telemetry KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#111820] border border-[#F0EEE5]/10 mb-4 text-xs font-mono rounded-sm">
                <div>
                  <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">CURRENT PITCH:</span>
                  <span className="text-[#D1B77D] font-bold">
                    {activeParams ? `${activeParams.frequencyHz} Hz` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">NOTE EQUIVALENT:</span>
                  <span className="text-[#F0EEE5] font-bold">
                    {activeParams ? activeParams.noteName : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">CADENCE TEMPO:</span>
                  <span className="text-[#E16D54] font-bold">
                    {activeParams ? `${activeParams.tempoBpm} BPM` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">RECORD POSITION:</span>
                  <span className="text-[#F0EEE5] font-bold">
                    {activeObs ? `${activeObs.year} (${(currentPayload?.index || 0) + 1}/${currentPayload?.totalRecords || 0})` : '—'}
                  </span>
                </div>
              </div>

              {/* Scrubber Range Slider */}
              {currentPayload && (
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] font-mono text-[#F0EEE5]/60">
                    <span>SEEK HEAD: {currentPayload.index + 1}</span>
                    <span className="text-[#D1B77D] font-semibold">{currentPayload.progressPercent}% PROGRESSION</span>
                    <span>TOTAL: {currentPayload.totalRecords} DATUMS</span>
                  </div>
                  <input
                    type="range"
                    role="slider"
                    aria-label="Timeline playhead scrubber"
                    aria-valuenow={currentPayload.index}
                    aria-valuemin={0}
                    aria-valuemax={currentPayload.totalRecords - 1}
                    aria-valuetext={`Observation datum ${currentPayload.index + 1} of ${currentPayload.totalRecords}, Year ${activeObs?.year || 'Unknown'}`}
                    min={0}
                    max={currentPayload.totalRecords - 1}
                    value={currentPayload.index}
                    onChange={(e) => handleScrub(Number(e.target.value))}
                    className="w-full accent-[#E16D54] cursor-pointer h-2 bg-[#111820] border border-[#F0EEE5]/20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
                  />
                </div>
              )}
            </div>

            {/* Transport Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F0EEE5]/10">
              {/* Playback Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTogglePlay}
                  icon={
                    transportState === 'PLAYING' ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )
                  }
                >
                  {transportState === 'PLAYING' ? 'PAUSE' : 'PLAY'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStop}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  STOP
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReplay}
                  icon={<FastForward className="w-3.5 h-3.5" />}
                >
                  REPLAY
                </Button>

                <button
                  onClick={handleToggleLoop}
                  className={`p-2 border text-xs font-mono transition-colors rounded-sm flex items-center gap-1 cursor-pointer ${
                    isLooping
                      ? 'border-[#D1B77D] text-[#D1B77D] bg-[#D1B77D]/10'
                      : 'border-[#F0EEE5]/15 text-[#F0EEE5]/60 hover:text-[#F0EEE5]'
                  }`}
                  title="Toggle Timeline Looping"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">LOOP</span>
                </button>
              </div>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-1 border border-[#F0EEE5]/15 p-1 bg-[#111820] rounded-sm">
                {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 text-[10px] font-mono transition-colors rounded-sm cursor-pointer ${
                      speedMultiplier === speed
                        ? 'bg-[#F0EEE5] text-[#111820] font-bold'
                        : 'text-[#F0EEE5]/60 hover:text-[#F0EEE5]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Audio Volume & Mute Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute master audio bus' : 'Mute master audio bus'}
                  className="p-1.5 border border-[#F0EEE5]/15 hover:border-[#D1B77D] text-[#F0EEE5]/60 hover:text-[#F0EEE5] transition-colors rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-[#E16D54]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#D1B77D]" />
                  )}
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-[#F0EEE5]/60">
                  <Sliders className="w-3.5 h-3.5" />
                  <input
                    type="range"
                    role="slider"
                    aria-label="Master audio output volume"
                    aria-valuenow={Math.round(masterVolume * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${Math.round(masterVolume * 100)} percent`}
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-[#E16D54] cursor-pointer h-1.5 bg-[#111820] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
                  />
                  <span className="text-[#F0EEE5] w-7 text-right">{Math.round(masterVolume * 100)}%</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Live Scientific Sound-to-Data Explanation Panel */}
        {activeParams && (
          <Panel className="lab-reveal p-6 sm:p-7 border-[#F0EEE5]/10 bg-[#0C1017]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EEE5]/10">
              <div className="flex items-center gap-2 text-[#D1B77D]">
                <Info className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                  AUDITORY DISPLAY SPECIFICATION // REAL-TIME EMPIRICAL MAPPING
                </span>
              </div>
              <Badge variant="signal">TRUE DETERMINISTIC SONIFICATION</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Mapping 1: Magnitude to Pitch */}
              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 block text-[10px] uppercase tracking-wider">
                  1. MAGNITUDE → PITCH FREQUENCY
                </span>
                <div className="text-[#D1B77D] font-bold text-sm">
                  {activeParams.frequencyHz} Hz ({activeParams.noteName})
                </div>
                <p className="text-[#F0EEE5]/75 font-sans text-[11px] leading-relaxed">
                  {activeParams.explanation.pitchFormula}
                </p>
              </div>

              {/* Mapping 2: Rate of Change to Rhythm */}
              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 block text-[10px] uppercase tracking-wider">
                  2. CHANGE RATE → RHYTHM CADENCE
                </span>
                <div className="text-[#E16D54] font-bold text-sm">
                  {activeParams.tempoBpm} BPM ({activeParams.stepIntervalMs} ms)
                </div>
                <p className="text-[#F0EEE5]/75 font-sans text-[11px] leading-relaxed">
                  {activeParams.explanation.rhythmFormula}
                </p>
              </div>

              {/* Mapping 3: Intensity & Filter */}
              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 block text-[10px] uppercase tracking-wider">
                  3. VARIATION → SPECTRAL INTENSITY
                </span>
                <div className="text-[#F0EEE5] font-bold text-sm">
                  Cutoff {activeParams.filterCutoffHz} Hz (Gain: {activeParams.gain})
                </div>
                <p className="text-[#F0EEE5]/75 font-sans text-[11px] leading-relaxed">
                  {activeParams.explanation.intensityFormula}
                </p>
              </div>

              {/* Mapping 4: Psychoacoustic Harmony */}
              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 block text-[10px] uppercase tracking-wider">
                  4. PSYCHOACOUSTIC HARMONY
                </span>
                <div className="text-[#D1B77D] font-bold text-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#E16D54]" />
                  <span>{activeParams.explanation.dissonanceInterpretation.split(' ')[0]} Tension</span>
                </div>
                <p className="text-[#F0EEE5]/75 font-sans text-[11px] leading-relaxed">
                  {activeParams.explanation.dissonanceInterpretation}
                </p>
              </div>
            </div>

            {/* Empirical Observation Summary */}
            <div className="mt-4 pt-3 border-t border-[#F0EEE5]/10 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#F0EEE5]/60 gap-2">
              <div>
                <span>RAW OBSERVATION: </span>
                <span className="text-[#F0EEE5] font-semibold">
                  {activeParams.explanation.rawMeasurement} ({activeObs?.year})
                </span>
                <span> — {activeParams.explanation.baselineComparison}</span>
              </div>
              <span className="text-[#D1B77D] font-mono">
                RATE: {activeParams.explanation.rateOfChangeMetric}
              </span>
            </div>
          </Panel>
        )}
      </div>
    </section>
  );
};
