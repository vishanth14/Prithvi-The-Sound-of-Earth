import React, { useState, useEffect, useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { nasaFrameService } from '../../services/nasaFrameService';
import type { NasaSvsFrame, VisualComparisonMode } from '../../types/nasaSvsTypes';
import { MagneticButton } from '../common/MagneticButton';
import {
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Activity,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Columns,
  Eye,
  Radio,
  Info,
} from 'lucide-react';

interface NasaSvsVisualizerProps {
  spiralSvgRef?: React.RefObject<SVGSVGElement | null>;
  spiralParams?: any;
}

export const NasaSvsVisualizer: React.FC<NasaSvsVisualizerProps> = ({
  spiralSvgRef,
  spiralParams,
}) => {
  const {
    selectedObservationIndex,
    currentObservation,
    currentSonificationParams,
    transportState,
    startPlayback,
    pausePlayback,
    seekToIndex,
    replayPlayback,
    isAudioUnlocked,
    unlockAudio,
  } = useObservatoryStore();

  const [frames, setFrames] = useState<NasaSvsFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<NasaSvsFrame | null>(null);
  const [comparisonMode, setComparisonMode] = useState<VisualComparisonMode>('dual');
  const [useVideoSync, setUseVideoSync] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 1. Load NASA Frame Manifest on mount
  useEffect(() => {
    let isMounted = true;
    nasaFrameService.loadManifest().then((loadedFrames) => {
      if (isMounted && loadedFrames.length > 0) {
        setFrames(loadedFrames);
        const initialFrame = loadedFrames[selectedObservationIndex] || loadedFrames[0];
        setCurrentFrame(initialFrame);
        nasaFrameService.preloadWindow(selectedObservationIndex, 3);
        setCachedCount(nasaFrameService.getCachedCount());
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize current NASA frame when observation index changes
  useEffect(() => {
    if (frames.length === 0) return;

    if (comparisonMode === '3d-tornado') {
      const tornado = nasaFrameService.get3DTornadoFrame();
      setCurrentFrame(tornado);
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    const frame = nasaFrameService.getFrameForIndex(selectedObservationIndex);
    if (frame) {
      setCurrentFrame(frame);
      setImageLoaded(false);
      setImageError(false);
      nasaFrameService.preloadWindow(selectedObservationIndex, 3);
      setCachedCount(nasaFrameService.getCachedCount());

      // If video mode is active, sync video playback time
      if (videoRef.current) {
        const targetTime = frame.timestampSeconds;
        if (Math.abs(videoRef.current.currentTime - targetTime) > 0.25) {
          videoRef.current.currentTime = targetTime;
        }
      }
    }
  }, [selectedObservationIndex, frames, comparisonMode]);

  // 3. Coordinate video play/pause with transport state
  useEffect(() => {
    if (!videoRef.current || !useVideoSync) return;

    if (transportState === 'PLAYING') {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [transportState, useVideoSync]);

  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (transportState === 'PLAYING') {
      pausePlayback();
    } else {
      await startPlayback();
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !useVideoSync || transportState !== 'PLAYING') return;

    const t = videoRef.current.currentTime;
    // Map video time t (0 to 23.37s) back to observation index
    const decYear = 1880 + t / 0.159138;
    const closestIdx = frames.findIndex((f) => f.year >= Math.floor(decYear));
    if (closestIdx !== -1 && closestIdx !== selectedObservationIndex) {
      seekToIndex(closestIdx, false);
    }
  };

  const activeAnomaly = currentObservation?.originalValue ?? currentFrame?.anomaly ?? 0;
  const activeYear = currentObservation?.year ?? currentFrame?.year ?? 1880;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & COMPARISON MODE CONTROLS                           */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#070B10] border border-[#252D36]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#FF5938] animate-pulse" />
          <div>
            <h4 className="font-display font-extrabold text-sm sm:text-base tracking-wider text-[#E9EDF0] uppercase">
              NASA SVS #5190 // EMPIRICAL FRAME SYNCHRONIZATION
            </h4>
            <p className="font-mono text-[10px] sm:text-[11px] text-[#7E8B98]">
              AUTHENTIC SCIENTIFIC VISUALIZATION STUDIO ASSET • 60 FPS • GISTEMP v4
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setComparisonMode('dual')}
            data-cursor-label="DUAL"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === 'dual'
                ? 'bg-[#FF5938] text-[#070B10] font-bold border border-[#FF5938]'
                : 'bg-[#0E141D] text-[#E9EDF0]/70 border border-[#252D36] hover:text-white'
            }`}
            title="Side-by-side comparison: NASA SVS 5190 Original + PRITHVI Derived Spiral"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>DUAL COMPARISON</span>
          </button>

          <button
            onClick={() => setComparisonMode('nasa-original')}
            data-cursor-label="NASA"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === 'nasa-original'
                ? 'bg-[#FF5938] text-[#070B10] font-bold border border-[#FF5938]'
                : 'bg-[#0E141D] text-[#E9EDF0]/70 border border-[#252D36] hover:text-white'
            }`}
            title="Authentic NASA SVS 5190 Original Visualization Focus"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>NASA ORIGINAL</span>
          </button>

          <button
            onClick={() => setComparisonMode('prithvi-spiral')}
            data-cursor-label="SPIRAL"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === 'prithvi-spiral'
                ? 'bg-[#FF5938] text-[#070B10] font-bold border border-[#FF5938]'
                : 'bg-[#0E141D] text-[#E9EDF0]/70 border border-[#252D36] hover:text-white'
            }`}
            title="PRITHVI Derived Real-time D3 Vector Polar Spiral"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>DERIVED VECTOR</span>
          </button>

          <button
            onClick={() => setComparisonMode('3d-tornado')}
            data-cursor-label="3D ELEVATION"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === '3d-tornado'
                ? 'bg-[#FF5938] text-[#070B10] font-bold border border-[#FF5938]'
                : 'bg-[#0E141D] text-[#E9EDF0]/70 border border-[#252D36] hover:text-white'
            }`}
            title="NASA SVS 3D Cylinder Elevation View: 1880-2026 Thermal Tornado"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D TORNADO</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. THREE-PILLAR SCIENTIFIC COMPARISON VIEWPORT                      */}
      {/* =================================================================== */}
      <div
        className={`grid gap-6 ${
          comparisonMode === 'dual'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 max-w-2xl mx-auto w-full'
        }`}
      >
        {/* PILLAR 1: AUTHENTIC NASA SVS #5190 VISUALIZATION */}
        {(comparisonMode === 'dual' ||
          comparisonMode === 'nasa-original' ||
          comparisonMode === '3d-tornado') && (
          <div className="flex flex-col bg-[#0E141D] border border-[#252D36] p-5 shadow-lg relative group">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252D36] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#83BBD5]" />
                <span className="text-[#83BBD5] font-bold tracking-widest uppercase">
                  1. ORIGINAL NASA VISUALIZATION
                </span>
              </div>
              <span className="text-[11px] text-[#7E8B98]">
                {comparisonMode === '3d-tornado'
                  ? '3D ELEVATION VIEW (FRAME #1788)'
                  : currentFrame
                  ? `FRAME #${currentFrame.frameIndex} (${currentFrame.timestampSeconds.toFixed(2)}s)`
                  : 'SVS #5190'}
              </span>
            </div>

            {/* Video / Frame Stage */}
            <div className="relative w-full aspect-square bg-[#070B10] border border-[#252D36] overflow-hidden flex items-center justify-center">
              {useVideoSync ? (
                <video
                  ref={videoRef}
                  src={nasaFrameService.getVideoUri()}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  onTimeUpdate={handleVideoTimeUpdate}
                />
              ) : currentFrame ? (
                <picture>
                  <source srcSet={currentFrame.webpUri} type="image/webp" />
                  <img
                    src={currentFrame.jpgUri}
                    alt={`NASA SVS 5190 Climate Spiral for year ${currentFrame.year}`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-80'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="lazy"
                  />
                </picture>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#7E8B98]">
                  <Activity className="w-8 h-8 animate-spin mb-2 text-[#FF5938]" />
                  <span className="text-xs font-mono">SYNCHRONIZING NASA SVS ASSET...</span>
                </div>
              )}

              {/* Error Fallback */}
              {imageError && (
                <div className="absolute inset-0 bg-[#070B10]/90 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-xs font-mono text-[#E9EDF0]">
                    NASA Visual Frame Stream Standby.
                  </p>
                  <p className="text-[10px] font-mono text-[#7E8B98] mt-1">
                    Telemetry, D3 Vector Spiral, and Tone.js remain operational.
                  </p>
                </div>
              )}

              {/* HUD Badge Overlay on NASA Visual */}
              <div className="absolute top-3 left-3 bg-[#070B10]/85 border border-[#252D36] px-2.5 py-1 text-[10px] font-mono text-[#E9EDF0] backdrop-blur-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF5938]" />
                <span>
                  {comparisonMode === '3d-tornado'
                    ? '3D COLUMN 1880–2026'
                    : `NASA SVS 5190 • ${activeYear}`}
                </span>
              </div>

              <div className="absolute bottom-3 right-3 bg-[#070B10]/85 border border-[#252D36] px-2.5 py-1 text-[10px] font-mono text-[#83BBD5] backdrop-blur-xs">
                <span>{activeAnomaly > 0 ? `+${activeAnomaly.toFixed(2)}` : activeAnomaly.toFixed(2)}°C</span>
              </div>
            </div>

            {/* Pillar 1 Technical Caption */}
            <div className="mt-4 pt-3 border-t border-[#252D36] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#7E8B98]">
              <span className="text-[#E9EDF0]/80">AUTHOR: Mark SubbaRao (NASA SVS)</span>
              <span className="text-[#83BBD5]">RESOLUTION: 2160x2160 60p</span>
            </div>
          </div>
        )}

        {/* PILLAR 2: PRITHVI DERIVED POLAR VECTOR SPIRAL */}
        {(comparisonMode === 'dual' || comparisonMode === 'prithvi-spiral') && (
          <div className="flex flex-col bg-[#0E141D] border border-[#252D36] p-5 shadow-lg relative group">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252D36] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF5938]" />
                <span className="text-[#FF5938] font-bold tracking-widest uppercase">
                  2. DERIVED POLAR VECTOR SPIRAL
                </span>
              </div>
              <span className="text-[11px] text-[#7E8B98]">REAL-TIME D3 SPATIAL GEOMETRY</span>
            </div>

            {/* D3 Vector Spiral Stage */}
            <div className="relative w-full aspect-square bg-[#070B10] border border-[#252D36] overflow-hidden flex items-center justify-center p-3">
              {spiralParams ? (
                <svg
                  ref={spiralSvgRef}
                  viewBox="0 0 460 460"
                  className="w-full h-full overflow-visible select-none"
                >
                  {/* Radial Month Axes */}
                  {spiralParams.monthAxes.map((axis: any) => (
                    <g key={axis.name}>
                      <line
                        x1={axis.x1}
                        y1={axis.y1}
                        x2={axis.x2}
                        y2={axis.y2}
                        stroke="rgba(240, 238, 229, 0.08)"
                        strokeDasharray="2,3"
                      />
                      <text
                        x={axis.lx}
                        y={axis.ly}
                        fill="rgba(240, 238, 229, 0.5)"
                        fontSize="9"
                        fontFamily="IBM Plex Mono, monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {axis.name}
                      </text>
                    </g>
                  ))}

                  {/* 0.0°C Baseline Ring */}
                  <circle
                    cx={spiralParams.center}
                    cy={spiralParams.center}
                    r={spiralParams.ring0}
                    fill="none"
                    stroke="rgba(233, 237, 240, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={spiralParams.center + 6}
                    y={spiralParams.center - spiralParams.ring0 - 4}
                    fill="rgba(233, 237, 240, 0.6)"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    0.0°C (1951-1980)
                  </text>

                  {/* +1.0°C Warning Ring */}
                  <circle
                    cx={spiralParams.center}
                    cy={spiralParams.center}
                    r={spiralParams.ring1}
                    fill="none"
                    stroke="rgba(255, 179, 71, 0.35)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={spiralParams.center + 6}
                    y={spiralParams.center - spiralParams.ring1 - 4}
                    fill="#FFB347"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    +1.0°C
                  </text>

                  {/* +1.5°C Paris Accord Threshold Ring */}
                  <circle
                    cx={spiralParams.center}
                    cy={spiralParams.center}
                    r={spiralParams.ring15}
                    fill="none"
                    stroke="rgba(255, 89, 56, 0.5)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={spiralParams.center + 6}
                    y={spiralParams.center - spiralParams.ring15 - 4}
                    fill="#FF5938"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    +1.5°C (Paris Threshold)
                  </text>

                  {/* Rendered Historical Spiral Path */}
                  {(spiralParams.spiralD || spiralParams.pathD) && (
                    <path
                      d={spiralParams.spiralD || spiralParams.pathD}
                      fill="none"
                      stroke={spiralParams.currentTip?.color || '#FF5938'}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Active Coordinate Cursor Node */}
                  {spiralParams.currentTip && (
                    <>
                      <circle
                        cx={spiralParams.currentTip.x}
                        cy={spiralParams.currentTip.y}
                        r="5"
                        fill={spiralParams.currentTip.color || '#FF5938'}
                      />
                      <circle
                        cx={spiralParams.currentTip.x}
                        cy={spiralParams.currentTip.y}
                        r="9"
                        fill="none"
                        stroke={spiralParams.currentTip.color || '#FF5938'}
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    </>
                  )}
                </svg>
              ) : (
                <div className="text-center text-xs font-mono text-[#7E8B98]">
                  VECTOR CANVAS INITIALIZING...
                </div>
              )}

              {/* HUD Badge Overlay on Derived Visual */}
              <div className="absolute top-3 left-3 bg-[#070B10]/85 border border-[#252D36] px-2.5 py-1 text-[10px] font-mono text-[#FF5938] backdrop-blur-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF5938]" />
                <span>PRITHVI VECTOR SPIRAL • {activeYear}</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-[#070B10]/85 border border-[#252D36] px-2.5 py-1 text-[10px] font-mono text-[#E9EDF0] backdrop-blur-xs">
                <span>POLAR RADIUS: {activeAnomaly > 0 ? `+${activeAnomaly.toFixed(2)}` : activeAnomaly.toFixed(2)}°C</span>
              </div>
            </div>

            {/* Pillar 2 Technical Caption */}
            <div className="mt-4 pt-3 border-t border-[#252D36] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#7E8B98]">
              <span className="text-[#E9EDF0]/80">COORDINATES: D3 Polar Projection</span>
              <span className="text-[#FF5938]">THRESHOLD: +1.5°C Paris Accord</span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3. PILLAR 3: PRITHVI GENERATED WEBAUDIO SONIFICATION READOUT        */}
      {/* =================================================================== */}
      <div className="p-5 bg-[#0E141D] border border-[#252D36] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#252D36] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#83BBD5] animate-ping" />
            <span className="text-[#83BBD5] font-bold tracking-widest uppercase">
              3. DETERMINISTIC SONIFICATION TELEMETRY
            </span>
          </div>
          <span className="text-[11px] text-[#7E8B98]">
            TONE.JS WEB AUDIO GRAPH • DRIFT BOUNDED &lt; 30ms
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-[#070B10] border border-[#252D36]">
            <span className="block text-[10px] font-mono text-[#7E8B98] uppercase tracking-wider mb-1">
              OBSERVATION YEAR
            </span>
            <span className="font-display font-extrabold text-2xl text-[#E9EDF0]">
              {activeYear}
            </span>
          </div>

          <div className="p-3 bg-[#070B10] border border-[#252D36]">
            <span className="block text-[10px] font-mono text-[#7E8B98] uppercase tracking-wider mb-1">
              GISTEMP ANOMALY
            </span>
            <span
              className={`font-display font-extrabold text-2xl ${
                activeAnomaly > 1.0 ? 'text-[#FF5938]' : 'text-[#83BBD5]'
              }`}
            >
              {activeAnomaly > 0 ? `+${activeAnomaly.toFixed(2)}` : activeAnomaly.toFixed(2)}°C
            </span>
          </div>

          <div className="p-3 bg-[#070B10] border border-[#252D36]">
            <span className="block text-[10px] font-mono text-[#7E8B98] uppercase tracking-wider mb-1">
              PITCH FREQUENCY
            </span>
            <span className="font-display font-extrabold text-2xl text-[#E9EDF0]">
              {currentSonificationParams?.frequencyHz
                ? `${Math.round(currentSonificationParams.frequencyHz)} Hz`
                : `${Math.round(220 * Math.pow(2, activeAnomaly / 1.2))} Hz`}
            </span>
          </div>

          <div className="p-3 bg-[#070B10] border border-[#252D36]">
            <span className="block text-[10px] font-mono text-[#7E8B98] uppercase tracking-wider mb-1">
              MUSICAL NOTE &amp; HARMONIC
            </span>
            <span className="font-display font-extrabold text-2xl text-[#83BBD5]">
              {currentSonificationParams?.noteName || 'A3'}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. MASTER PLAYBACK TRANSPORT & FRAME SCRUBBER CONTROLLER            */}
      {/* =================================================================== */}
      <div className="p-5 bg-[#070B10] border border-[#252D36] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MagneticButton
              onClick={handleTogglePlay}
              data-cursor-label={transportState === 'PLAYING' ? 'PAUSE' : 'PLAY'}
              className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                transportState === 'PLAYING'
                  ? 'bg-[#FF5938] text-[#070B10] font-bold'
                  : 'bg-white text-[#070B10] hover:bg-[#FF5938] hover:text-white'
              }`}
            >
              {transportState === 'PLAYING' ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE PLAYBACK</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY SEQUENCE</span>
                </>
              )}
            </MagneticButton>

            <button
              onClick={() => replayPlayback()}
              data-cursor-label="REPLAY"
              className="p-2 border border-[#252D36] bg-[#0E141D] text-[#7E8B98] hover:text-white transition-colors cursor-pointer"
              title="Replay from 1880 Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Video Sync Toggle */}
          <button
            onClick={() => setUseVideoSync(!useVideoSync)}
            data-cursor-label="VIDEO"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 border ${
              useVideoSync
                ? 'bg-[#83BBD5] text-[#070B10] font-bold border-[#83BBD5]'
                : 'bg-[#0E141D] text-[#7E8B98] border-[#252D36] hover:text-white'
            }`}
            title="Toggle between cached 60fps MP4 video playback and instant preloaded frames"
          >
            {useVideoSync ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
            <span>{useVideoSync ? 'VIDEO STREAM: ACTIVE' : 'FRAME PIPELINE: ACTIVE'}</span>
          </button>

          {/* Preloader Cache Metric */}
          <div className="text-[11px] font-mono text-[#7E8B98] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>MEMORY CACHE: {cachedCount} FRAMES BUFFERED</span>
          </div>
        </div>

        {/* Master Timeline Scrubber */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#7E8B98]">
            <span>1880 (ORIGIN)</span>
            <span className="text-[#FF5938] font-bold">
              TIMELINE OBSERVATION: {selectedObservationIndex + 1} OF {frames.length || 38} ({activeYear})
            </span>
            <span>2026 (PRESENT)</span>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(0, (frames.length || 38) - 1)}
            value={selectedObservationIndex}
            onChange={(e) => seekToIndex(parseInt(e.target.value, 10), true)}
            aria-label="Seek NASA visual frame observation"
            className="w-full h-2 bg-[#252D36] accent-[#FF5938] cursor-pointer appearance-none outline-none"
          />
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. TIMING DISCLOSURE & OFFICIAL NASA SVS ATTRIBUTION                */}
      {/* =================================================================== */}
      <div className="p-4 bg-[#070B10] border border-[#252D36] space-y-3 text-xs font-mono text-[#7E8B98]">
        {/* Timing Model Disclosure */}
        <div className="flex items-start gap-2 text-[#E9EDF0]/80 bg-[#0E141D] p-3 border border-[#252D36]">
          <Info className="w-4 h-4 text-[#83BBD5] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[#83BBD5] font-bold uppercase block">
              FRAME TIMELINE MAPPING &amp; DISCLOSURE
            </span>
            <p className="text-[11px] leading-relaxed">
              NASA SVS #5190 is a 60 fps animation containing 1,800 frames over 30.0 seconds. The 2D Climate Spiral draws continuously from <strong>1880 (0.00s, Frame #0)</strong> to <strong>2026 (23.37s, Frame #1402)</strong> at an empirical rate of <strong>~9.55 frames per year (~0.796 frames per month)</strong>, followed by a 3D perspective rotation (Frames #1403–#1800).
              <span className="text-amber-400 block mt-0.5">
                Exact timing note: 1 video frame does not equal 1 calendar month. PRITHVI calculates deterministic temporal alignment based on Mark SubbaRao's official GISTEMP v4 animation rate.
              </span>
            </p>
          </div>
        </div>

        {/* Official Attribution & Citation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#252D36]">
          <div className="space-y-0.5">
            <span className="text-[#E9EDF0] font-semibold block">
              NASA Scientific Visualization Studio • Asset #5190
            </span>
            <span className="text-[11px] text-[#7E8B98]">
              GISS Surface Temperature Analysis (GISTEMP v4) • 1951–1980 Baseline Period
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://svs.gsfc.nasa.gov/5190/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#83BBD5] hover:text-white underline cursor-pointer"
            >
              <span>OFFICIAL SVS #5190 SOURCE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://data.giss.nasa.gov/gistemp/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#83BBD5] hover:text-white underline cursor-pointer"
            >
              <span>NASA GISTEMP v4 DATA</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
