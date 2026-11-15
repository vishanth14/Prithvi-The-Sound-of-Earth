import { create } from 'zustand';
import type { DatasetKey } from '../data/types';
import type { EicDatasetKey, EicObservation } from '../data/eicSchemas';
import type { SonificationParams } from '../audio/dataMapping';
import { audioTransport, type TransportState } from '../audio/audioTransport';
import { sonificationCore } from '../audio/sonification';
import { mapObservationToAudio } from '../audio/dataMapping';
import { EicDataService } from '../data/eicDataService';

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

export interface ClimateSentinel {
  id: string;
  name: string;
  stationCode: string;
  datasetKey: DatasetKey;
  eicKey: EicDatasetKey;
  description: string;
  lat: number;
  lng: number;
  color: string;
  instrument: string;
  baseline: string;
}

export const CLIMATE_SENTINELS: ClimateSentinel[] = [
  {
    id: 'mauna-loa',
    name: 'Mauna Loa Observatory, Hawaii',
    stationCode: 'MLO-NOAA',
    datasetKey: 'co2',
    eicKey: 'co2_maunaloa',
    description: 'Global benchmark for background atmospheric CO₂ mole fractions since 1958.',
    lat: 19.5362,
    lng: -155.5763,
    color: '#ef4444',
    instrument: 'Cavity Ring-Down Spectrometer',
    baseline: '280.0 ppm pre-industrial benchmark',
  },
  {
    id: 'svalbard',
    name: 'Svalbard Arctic Sentinel, Norway',
    stationCode: 'SVB-ARC',
    datasetKey: 'temperature',
    eicKey: 'gistemp',
    description: 'High-latitude warming sentinel monitoring extreme Arctic thermal amplification and sea ice retreat.',
    lat: 78.2232,
    lng: 15.6267,
    color: '#f59e0b',
    instrument: 'GISTEMP Ground Calibration & Modis Albedo',
    baseline: '1951-1980 mean',
  },
  {
    id: 'vostok',
    name: 'Vostok Research Station, Antarctica',
    stationCode: 'VOS-ICE',
    datasetKey: 'temperature',
    eicKey: 'gistemp',
    description: 'Deep ice-core borehole paleoclimate reference preserving 800,000 years of Earth atmosphere.',
    lat: -78.4644,
    lng: 106.8373,
    color: '#38bdf8',
    instrument: 'EPICA / Vostok Deep Ice Core Mass Spec',
    baseline: 'Holocene Equilibrium Baseline',
  },
  {
    id: 'atto-amazon',
    name: 'Amazon Tall Tower Observatory (ATTO), Brazil',
    stationCode: 'ATTO-BIO',
    datasetKey: 'vegetation',
    eicKey: 'aerosols_geos',
    description: '325m atmospheric chemistry tower measuring tropical wildfire smoke, biogenic VOCs and CO₂ flux.',
    lat: -2.1436,
    lng: -59.0011,
    color: '#8b5cf6',
    instrument: 'GEOS-FP Gas & Aerosol Sampling Mast',
    baseline: 'Clean-Sky Climatology (0.12 AOD)',
  },
  {
    id: 'pacific-tao',
    name: 'Pacific TAO/TRITON Buoy Array (Equator)',
    stationCode: 'TAO-ENSO',
    datasetKey: 'seaLevel',
    eicKey: 'sealevel_podaac',
    description: 'Moorings across equatorial Pacific measuring thermal expansion, El Niño oscillations and ocean heat.',
    lat: 0.0,
    lng: -140.0,
    color: '#06b6d4',
    instrument: 'Sentinel-6 / Jason Radar Calibration Array',
    baseline: '1993.0 Altimetry Reference Origin',
  },
];

interface ObservatoryState {
  // Navigation & View
  activeSection: string;
  isAudioUnlocked: boolean;
  isMuted: boolean;
  masterVolume: number; // 0 to 1
  
  // Dataset & Observation State (Single Source of Truth)
  activeDataset: DatasetKey;
  activeEicKey: EicDatasetKey;
  selectedYear: number;
  selectedObservationIndex: number;
  currentObservation: EicObservation | null;
  currentSonificationParams: SonificationParams | null;
  
  // Transport & Timeline Sequencer
  transportState: TransportState;
  timelineSpeed: number; // 0.5, 1, 1.5, 2
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
  
  // Unified Playback Controls
  startPlayback: () => Promise<void>;
  pausePlayback: () => void;
  stopPlayback: () => void;
  replayPlayback: () => Promise<void>;
  seekToIndex: (index: number, triggerAudio?: boolean) => void;
  seekToYear: (year: number, triggerAudio?: boolean) => void;
  setTimelineSpeed: (speed: number) => void;
  toggleLooping: () => void;

  // 3D Globe & Sentinel Actions
  setGlobeRotating: (rotating: boolean) => void;
  setActiveCameraTarget: (target: 'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science') => void;
  setHoveredCoordinate: (coord: { lat: number; lng: number } | null) => void;
  selectSentinel: (sentinelId: string | null) => Promise<void>;
  setHoveredSentinelId: (id: string | null) => void;
}

export const useObservatoryStore = create<ObservatoryState>((set, get) => {
  if (typeof window !== 'undefined') {
    (window as any).__observatoryStore = { getState: get, setState: set };
  }
  // Wire AudioTransport ticker callback directly into store
  audioTransport.onTick(({ observation, params, index }) => {
    const eicKey = observation.datasetId as EicDatasetKey;
    const datasetKey = EIC_TO_DATASET_MAP[eicKey] || 'temperature';

    // Compute 3D shader targets based on active measurement (Editorial, non-overexposed palette)
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
      selectedYear: observation.year,
      selectedObservationIndex: index,
      currentObservation: observation,
      currentSonificationParams: params,
      activeDataset: datasetKey,
      activeEicKey: eicKey,
      atmosphereTargetColor: atmosphereColor,
      atmosphereTargetCoefficient: atmosphereCoeff,
      nightLightBoost: nightBoost,
      thermalAnomalyFactor: heatFactor,
    });
  });

  // Wire transport state changes
  audioTransport.onStateChange((state) => {
    set({
      transportState: state,
    });
  });

  return {
    activeSection: 'hero',
    isAudioUnlocked: false,
    isMuted: false,
    masterVolume: 0.75,

    activeDataset: 'temperature',
    activeEicKey: 'gistemp',
    selectedYear: 2026,
    selectedObservationIndex: 0,
    currentObservation: null,
    currentSonificationParams: null,

    transportState: 'STOPPED',
    timelineSpeed: 1,
    isLooping: false,

    globeRotating: true,
    activeCameraTarget: 'hero',
    hoveredCoordinate: null,
    activeSentinelId: null,
    hoveredSentinelId: null,

    atmosphereTargetColor: '#1E5A7A',
    atmosphereTargetCoefficient: 0.35,
    nightLightBoost: 1.0,
    thermalAnomalyFactor: 0.0,

    setActiveSection: (section) => set({ activeSection: section }),

    unlockAudio: async () => {
      const ok = await sonificationCore.init();
      if (ok) {
        set({ isAudioUnlocked: true });
      }
    },

    toggleMute: () => {
      const nextMuted = !get().isMuted;
      set({ isMuted: nextMuted });
      sonificationCore.setMuted(nextMuted);
    },

    setMasterVolume: (masterVolume) => {
      set({ masterVolume });
      sonificationCore.setVolume(masterVolume);
    },

    setActiveDataset: async (key: DatasetKey) => {
      const eicKey = DATASET_TO_EIC_MAP[key];
      await get().setActiveEicKey(eicKey);
    },

    setActiveEicKey: async (eicKey: EicDatasetKey) => {
      const dataset = await EicDataService.loadDataset(eicKey);
      const obs = dataset.observations;
      const legacyKey = EIC_TO_DATASET_MAP[eicKey] || 'temperature';

      const wasPlaying = get().transportState === 'PLAYING';
      audioTransport.loadSequence(obs, obs.length - 1);

      const latestObs = obs[obs.length - 1];
      const prevObs = obs.length > 1 ? obs[obs.length - 2] : undefined;
      const params = mapObservationToAudio(latestObs, prevObs);

      set({
        activeEicKey: eicKey,
        activeDataset: legacyKey,
        selectedYear: latestObs.year,
        selectedObservationIndex: obs.length - 1,
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

      // If no sequence loaded, load active dataset sequence
      const activeEic = get().activeEicKey;
      const dataset = await EicDataService.loadDataset(activeEic);
      audioTransport.loadSequence(dataset.observations, get().selectedObservationIndex);
      await audioTransport.play();
    },

    pausePlayback: () => {
      audioTransport.pause();
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
      set({ timelineSpeed: speed });
      audioTransport.setSpeedMultiplier(speed);
    },

    toggleLooping: () => {
      const next = !get().isLooping;
      set({ isLooping: next });
      audioTransport.setIsLooping(next);
    },

    setGlobeRotating: (globeRotating) => set({ globeRotating }),
    setActiveCameraTarget: (activeCameraTarget) => set({ activeCameraTarget }),
    setHoveredCoordinate: (hoveredCoordinate) => set({ hoveredCoordinate }),
    setHoveredSentinelId: (hoveredSentinelId) => set({ hoveredSentinelId }),

    selectSentinel: async (sentinelId: string | null) => {
      if (!sentinelId) {
        set({ activeSentinelId: null });
        return;
      }
      const sentinel = CLIMATE_SENTINELS.find((s) => s.id === sentinelId);
      if (!sentinel) return;

      set({
        activeSentinelId: sentinel.id,
        hoveredCoordinate: { lat: sentinel.lat, lng: sentinel.lng },
      });

      // Switch to this sentinel's observational dataset
      await get().setActiveEicKey(sentinel.eicKey);

      // Play local acoustic signature
      if (get().isAudioUnlocked) {
        const obs = get().currentObservation;
        if (obs) {
          const params = mapObservationToAudio(obs);
          await sonificationCore.playMeasurement(params);
        }
      }
    },
  };
});
