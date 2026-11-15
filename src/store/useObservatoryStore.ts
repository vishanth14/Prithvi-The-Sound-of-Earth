import { create } from 'zustand';
import type { DatasetKey } from '../data/types';
import type { EicDatasetKey, EicObservation } from '../data/eicSchemas';
import type { SonificationParams } from '../audio/dataMapping';
import {
  audioTransport,
  type TransportState,
  type MeasuredSyncError,
} from '../audio/audioTransport';
import { sonificationCore } from '../audio/sonification';
import { mapObservationToAudio } from '../audio/dataMapping';
import { EicDataService } from '../data/eicDataService';
import {
  CLIMATE_SENTINELS,
  type ClimateSentinel,
} from '../data/climateSentinels';

export { CLIMATE_SENTINELS, type ClimateSentinel };

// Bidirectional mapping between legacy dataset keys and authentic EIC keys
export const DATASET_TO_EIC_MAP: Record<DatasetKey, EicDatasetKey> = {
  temperature: 'gistemp',
  co2: 'co2_maunaloa',
  seaLevel: 'sealevel_podaac',
  vegetation: 'aerosols_geos',
  ozone: 'nightlights_viirs',
};

export const EIC_TO_DATASET_MAP: Record<EicDatasetKey, DatasetKey> = {
  gistemp: 'temperature',
  co2_maunaloa: 'co2',
  sealevel_podaac: 'seaLevel',
  aerosols_geos: 'vegetation',
  nightlights_viirs: 'ozone',
};

export interface ObservatoryState {
  // Navigation & View
  activeSection: string;
  isAudioUnlocked: boolean;
  isMuted: boolean;
  masterVolume: number; // 0 to 1

  // =========================================================================
  // AUTHORITATIVE STATE FIELDS (Required Specification)
  // =========================================================================
  activeDatasetId: EicDatasetKey;
  currentObservationIndex: number;
  currentTimestamp: number | string;
  playbackPosition: number; // 0.0 to 1.0 fractional timeline progress
  playbackState: TransportState;
  playbackSpeed: number;
  loopEnabled: boolean;
  volume: number;
  audioEnabled: boolean;
  isBuffering: boolean;
  bufferingReason: string | null;

  // Real-Time Measured Synchronization Metrics
  measuredSyncError: MeasuredSyncError;

  // Backward-compatibility Aliases
  activeDataset: DatasetKey;
  activeEicKey: EicDatasetKey;
  selectedYear: number;
  selectedObservationIndex: number;
  currentObservation: EicObservation | null;
  currentSonificationParams: SonificationParams | null;
  transportState: TransportState;
  timelineSpeed: number;
  isLooping: boolean;

  // 3D Globe Shader & Physical Environment Controls
  globeRotating: boolean;
  activeCameraTarget: 'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science';
  hoveredCoordinate: { lat: number; lng: number } | null;
  activeSentinelId: string | null;
  hoveredSentinelId: string | null;

  // Real-time 3D Shader Uniform Targets
  atmosphereTargetColor: string;
  atmosphereTargetCoefficient: number;
  nightLightBoost: number;
  thermalAnomalyFactor: number;

  // Actions
  setActiveSection: (section: string) => void;
  unlockAudio: () => Promise<void>;
  toggleMute: () => void;
  setMasterVolume: (vol: number) => void;

  // Unified Dataset Switcher
  setActiveDataset: (key: DatasetKey) => Promise<void>;
  setActiveEicKey: (key: EicDatasetKey) => Promise<void>;
  setActiveDatasetId: (key: EicDatasetKey) => Promise<void>;

  // Authoritative Playback & Transport Controls
  startPlayback: () => Promise<void>;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stopPlayback: () => void;
  replayPlayback: () => Promise<void>;
  seekToIndex: (index: number, triggerAudio?: boolean) => void;
  seekToYear: (year: number, triggerAudio?: boolean) => void;
  setTimelineSpeed: (speed: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLooping: () => void;
  setLoopEnabled: (enabled: boolean) => void;
  setBuffering: (isBuffering: boolean, reason?: string | null) => void;

  // 3D Globe & Sentinel Actions
  setGlobeRotating: (rotating: boolean) => void;
  setActiveCameraTarget: (target: 'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science') => void;
  setHoveredCoordinate: (coord: { lat: number; lng: number } | null) => void;
  selectSentinel: (sentinelId: string | null) => Promise<void>;
  setHoveredSentinelId: (id: string | null) => void;
  cameraResetTrigger: number;
  sentinelFocusTrigger: number;
  triggerSentinelFocus: () => void;
  resetCameraOrientation: () => void;
}

export const useObservatoryStore = create<ObservatoryState>((set, get) => {
  if (typeof window !== 'undefined') {
    (window as any).__observatoryStore = { getState: get, setState: set };
  }

  // Wire authoritative AudioTransport ticker callback directly into store
  audioTransport.onTick(({ observation, params, index, syncMetrics }) => {
    const eicKey = observation.datasetId as EicDatasetKey;
    const datasetKey = EIC_TO_DATASET_MAP[eicKey] || 'temperature';

    // Compute 3D shader targets based on active measurement
    let atmosphereColor = '#1E5A7A';
    let atmosphereCoeff = 0.38;
    let nightBoost = 1.0;
    let heatFactor = 0.0;

    switch (eicKey) {
      case 'gistemp': {
        const val = observation.originalValue ?? 0;
        heatFactor = Math.max(0, Math.min(1, (val - (-0.4)) / (1.5 - (-0.4))));
        atmosphereColor = val > 1.0 ? '#C96846' : val > 0.4 ? '#D1B77D' : '#1E5A7A';
        atmosphereCoeff = 0.32 + heatFactor * 0.12;
        break;
      }
      case 'co2_maunaloa': {
        const ppm = observation.originalValue ?? 280;
        const norm = Math.max(0, Math.min(1, (ppm - 280) / (440 - 280)));
        atmosphereColor = norm > 0.6 ? '#B85B38' : '#1E5A7A';
        atmosphereCoeff = 0.35 + norm * 0.10;
        break;
      }
      case 'sealevel_podaac': {
        atmosphereColor = '#17465B';
        atmosphereCoeff = 0.38;
        break;
      }
      case 'aerosols_geos': {
        atmosphereColor = '#4E446B';
        atmosphereCoeff = 0.36;
        break;
      }
      case 'nightlights_viirs': {
        atmosphereColor = '#D1B77D';
        atmosphereCoeff = 0.32;
        nightBoost = 1.0 + (params.velocity * 0.8);
        break;
      }
    }

    set({
      // Authoritative State Fields
      activeDatasetId: eicKey,
      currentObservationIndex: index,
      currentTimestamp: observation.year,
      playbackPosition: Number((index / Math.max(1, (get().currentObservationIndex || 1))).toFixed(3)),
      volume: get().masterVolume,
      audioEnabled: get().isAudioUnlocked && !get().isMuted,
      isBuffering: false,
      bufferingReason: null,
      measuredSyncError: syncMetrics || get().measuredSyncError,

      // Backward-compatibility aliases
      selectedYear: observation.year,
      selectedObservationIndex: index,
      currentObservation: observation,
      currentSonificationParams: params,
      activeDataset: datasetKey,
      activeEicKey: eicKey,

      // 3D Shader Uniform Targets
      atmosphereTargetColor: atmosphereColor,
      atmosphereTargetCoefficient: atmosphereCoeff,
      nightLightBoost: nightBoost,
      thermalAnomalyFactor: heatFactor,
    });
  });

  // Wire authoritative transport state changes
  audioTransport.onStateChange((state) => {
    set({
      transportState: state,
      playbackState: state,
    });
  });

  // Wire authoritative buffering state changes
  audioTransport.onBuffering(({ isBuffering, reason }) => {
    set({
      isBuffering,
      bufferingReason: reason || null,
    });
  });

  return {
    activeSection: 'hero',
    isAudioUnlocked: false,
    isMuted: false,
    masterVolume: 0.75,

    // Authoritative State Defaults
    activeDatasetId: 'gistemp',
    currentObservationIndex: 0,
    currentTimestamp: 2024,
    playbackPosition: 0.0,
    playbackState: 'STOPPED',
    playbackSpeed: 1.0,
    loopEnabled: false,
    volume: 0.75,
    audioEnabled: false,
    isBuffering: false,
    bufferingReason: null,

    measuredSyncError: {
      lastJitterMs: 0,
      meanJitterMs: 0,
      maxJitterMs: 0,
      sampleCount: 0,
    },

    // Backward-compatibility Aliases
    activeDataset: 'temperature',
    activeEicKey: 'gistemp',
    selectedYear: 2024,
    selectedObservationIndex: 0,
    currentObservation: null,
    currentSonificationParams: null,

    transportState: 'STOPPED',
    timelineSpeed: 1.0,
    isLooping: false,

    globeRotating: true,
    activeCameraTarget: 'hero',
    hoveredCoordinate: null,
    activeSentinelId: null,
    hoveredSentinelId: null,
    cameraResetTrigger: 0,
    sentinelFocusTrigger: 0,

    atmosphereTargetColor: '#1E5A7A',
    atmosphereTargetCoefficient: 0.35,
    nightLightBoost: 1.0,
    thermalAnomalyFactor: 0.0,

    setActiveSection: (section) => set({ activeSection: section }),

    unlockAudio: async () => {
      const ok = await sonificationCore.init();
      if (ok) {
        set({
          isAudioUnlocked: true,
          audioEnabled: !get().isMuted,
        });
      }
    },

    toggleMute: () => {
      const nextMuted = !get().isMuted;
      set({
        isMuted: nextMuted,
        audioEnabled: get().isAudioUnlocked && !nextMuted,
      });
      sonificationCore.setMuted(nextMuted);
    },

    setMasterVolume: (masterVolume) => {
      const clamped = Math.max(0, Math.min(1, masterVolume));
      set({ masterVolume: clamped, volume: clamped });
      sonificationCore.setVolume(clamped);
    },

    setActiveDataset: async (key: DatasetKey) => {
      const eicKey = DATASET_TO_EIC_MAP[key];
      await get().setActiveEicKey(eicKey);
    },

    setActiveDatasetId: async (eicKey: EicDatasetKey) => {
      await get().setActiveEicKey(eicKey);
    },

    setActiveEicKey: async (eicKey: EicDatasetKey) => {
      const dataset = await EicDataService.loadDataset(eicKey);
      const obs = dataset.observations;
      const legacyKey = EIC_TO_DATASET_MAP[eicKey] || 'temperature';

      const wasPlaying = get().playbackState === 'PLAYING';
      const initialIndex = obs.length - 1;
      audioTransport.loadSequence(obs, initialIndex);

      const latestObs = obs[initialIndex];
      const prevObs = obs.length > 1 ? obs[obs.length - 2] : undefined;
      const params = mapObservationToAudio(latestObs, prevObs);

      set({
        activeDatasetId: eicKey,
        activeEicKey: eicKey,
        activeDataset: legacyKey,
        currentObservationIndex: initialIndex,
        selectedObservationIndex: initialIndex,
        currentTimestamp: latestObs.year,
        selectedYear: latestObs.year,
        currentObservation: latestObs,
        currentSonificationParams: params,
      });

      if (wasPlaying) {
        await audioTransport.play();
      }
    },

    startPlayback: async () => {
      if (!get().isAudioUnlocked) {
        await get().unlockAudio();
      }

      // Ensure active dataset sequence is loaded
      const activeEic = get().activeDatasetId;
      const dataset = await EicDataService.loadDataset(activeEic);
      audioTransport.loadSequence(dataset.observations, get().currentObservationIndex);
      await audioTransport.play();
    },

    pausePlayback: () => {
      audioTransport.pause();
    },

    resumePlayback: () => {
      audioTransport.resume();
    },

    stopPlayback: () => {
      audioTransport.stop();
    },

    replayPlayback: async () => {
      if (!get().isAudioUnlocked) await get().unlockAudio();
      await audioTransport.replay();
    },

    seekToIndex: (index: number, triggerAudio = true) => {
      audioTransport.seekToIndex(index, triggerAudio);
    },

    seekToYear: (year: number, triggerAudio = true) => {
      audioTransport.seekToYear(year, triggerAudio);
    },

    setTimelineSpeed: (speed: number) => {
      get().setPlaybackSpeed(speed);
    },

    setPlaybackSpeed: (speed: number) => {
      set({ playbackSpeed: speed, timelineSpeed: speed });
      audioTransport.setSpeedMultiplier(speed);
    },

    toggleLooping: () => {
      const next = !get().loopEnabled;
      get().setLoopEnabled(next);
    },

    setLoopEnabled: (enabled: boolean) => {
      set({ loopEnabled: enabled, isLooping: enabled });
      audioTransport.setIsLooping(enabled);
    },

    setBuffering: (isBuffering: boolean, reason?: string | null) => {
      audioTransport.setBuffering(isBuffering, reason || undefined);
      set({ isBuffering, bufferingReason: reason || null });
    },

    setGlobeRotating: (globeRotating) => set({ globeRotating }),
    setActiveCameraTarget: (activeCameraTarget) => set({ activeCameraTarget }),
    setHoveredCoordinate: (hoveredCoordinate) => set({ hoveredCoordinate }),
    setHoveredSentinelId: (hoveredSentinelId) => set({ hoveredSentinelId }),

    triggerSentinelFocus: () => {
      set((s) => ({ sentinelFocusTrigger: s.sentinelFocusTrigger + 1 }));
    },

    resetCameraOrientation: () => {
      set((s) => ({
        cameraResetTrigger: s.cameraResetTrigger + 1,
        activeSentinelId: null,
        hoveredSentinelId: null,
      }));
    },

    selectSentinel: async (sentinelId: string | null) => {
      if (!sentinelId) {
        set((s) => ({
          activeSentinelId: null,
          hoveredSentinelId: null,
          cameraResetTrigger: s.cameraResetTrigger + 1,
        }));
        return;
      }
      const sentinel = CLIMATE_SENTINELS.find((s) => s.id === sentinelId);
      if (!sentinel) return;

      set((s) => ({
        activeSentinelId: sentinel.id,
        sentinelFocusTrigger: s.sentinelFocusTrigger + 1,
        hoveredCoordinate: { lat: sentinel.lat, lng: sentinel.lng },
      }));

      // Switch to this sentinel's observational dataset
      await get().setActiveEicKey(sentinel.eicKey);

      // Play local acoustic signature
      if (get().isAudioUnlocked && !get().isMuted) {
        const obs = get().currentObservation;
        if (obs) {
          const params = mapObservationToAudio(obs);
          await sonificationCore.playMeasurement(params);
        }
      }
    },
  };
});
