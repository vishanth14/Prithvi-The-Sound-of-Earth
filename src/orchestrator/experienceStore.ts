import { create } from 'zustand';
import type {
  ChapterId,
  CameraMode,
  VisualScene,
  ChapterTransitionState,
} from './experienceTypes';
import { CHAPTER_CONFIGS, CHAPTER_SEQUENCE } from './chapterConfig';

export interface ExperienceState {
  // Meaningful Shared State
  currentChapter: ChapterId;
  activeVisualScene: VisualScene;
  cameraMode: CameraMode;
  selectedScientificStory: string;
  transitionState: ChapterTransitionState;
  isInitialLoading: boolean;

  // Actions
  setChapter: (chapter: ChapterId) => void;
  setCameraMode: (mode: CameraMode) => void;
  setActiveVisualScene: (scene: VisualScene) => void;
  setSelectedScientificStory: (storyId: string) => void;
  setTransitionState: (state: Partial<ChapterTransitionState>) => void;
  setInitialLoading: (loading: boolean) => void;
  navigateToChapter: (chapter: ChapterId, options?: { duration?: number; offset?: number }) => void;
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  currentChapter: 'ch1-origin',
  activeVisualScene: 'deep-space-origin',
  cameraMode: 'origin',
  selectedScientificStory: 'thermal-spiral',
  isInitialLoading: true,
  transitionState: {
    isTransitioning: false,
    fromChapter: null,
    toChapter: null,
    progress: 0,
    direction: 'forward',
  },

  setInitialLoading: (isInitialLoading: boolean) => {
    set({ isInitialLoading });
  },

  setChapter: (chapter: ChapterId) => {
    const config = CHAPTER_CONFIGS[chapter];
    if (!config) return;

    const current = get().currentChapter;
    if (current === chapter) return;

    set({
      currentChapter: chapter,
      cameraMode: config.cameraMode,
      activeVisualScene: config.visualScene,
    });
  },

  setCameraMode: (mode: CameraMode) => {
    set({ cameraMode: mode });
  },

  setActiveVisualScene: (scene: VisualScene) => {
    set({ activeVisualScene: scene });
  },

  setSelectedScientificStory: (storyId: string) => {
    set({ selectedScientificStory: storyId });
  },

  setTransitionState: (partial: Partial<ChapterTransitionState>) => {
    set((state) => ({
      transitionState: {
        ...state.transitionState,
        ...partial,
      },
    }));
  },

  navigateToChapter: (targetChapter: ChapterId, options = {}) => {
    const config = CHAPTER_CONFIGS[targetChapter];
    if (!config) return;

    const fromChapter = get().currentChapter;
    const fromIndex = CHAPTER_SEQUENCE.indexOf(fromChapter);
    const toIndex = CHAPTER_SEQUENCE.indexOf(targetChapter);
    const direction = toIndex >= fromIndex ? 'forward' : 'backward';

    // Mark transition active
    set({
      transitionState: {
        isTransitioning: true,
        fromChapter,
        toChapter: targetChapter,
        progress: 0,
        direction,
      },
      currentChapter: targetChapter,
      cameraMode: config.cameraMode,
      activeVisualScene: config.visualScene,
    });

    // Coordinate with Lenis and Browser History
    const targetElement = document.getElementById(config.domId);
    const lenis = (window as any).__lenis;

    // Update browser URL hash cleanly without jarring instant jumps
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `#${config.domId}`);
    }

    if (targetElement) {
      if (lenis) {
        const duration = options.duration ?? 1.25;
        lenis.scrollTo('#' + config.domId, {
          offset: options.offset ?? 0,
          duration,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          onComplete: () => {
            get().setTransitionState({
              isTransitioning: false,
              fromChapter: null,
              toChapter: null,
              progress: 1,
            });
          },
        });
      } else {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          get().setTransitionState({
            isTransitioning: false,
            fromChapter: null,
            toChapter: null,
            progress: 1,
          });
        }, 1200);
      }
    } else {
      get().setTransitionState({
        isTransitioning: false,
        fromChapter: null,
        toChapter: null,
        progress: 1,
      });
    }
  },
}));
