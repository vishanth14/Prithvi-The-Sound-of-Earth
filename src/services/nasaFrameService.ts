import type { NasaSvsFrame } from '../types/nasaSvsTypes';

/**
 * NASA SVS 5190 Frame Asset Pipeline Service
 * 
 * Provides calibrated frame-to-observation mapping, lazy loading,
 * and memory-safe sliding window preloading around the current observation index.
 */
class NasaFrameService {
  private frames: NasaSvsFrame[] = [];
  private isLoaded = false;
  private loadPromise: Promise<NasaSvsFrame[]> | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private maxCacheSize = 12; // Strictly limit images in memory (current ± 3 plus buffer)

  /**
   * Loads the frame manifest from public static assets
   */
  public async loadManifest(): Promise<NasaSvsFrame[]> {
    if (this.isLoaded) return this.frames;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const res = await fetch('/nasa_svs_5190/frame_manifest.json');
        if (!res.ok) {
          throw new Error(`Failed to load NASA frame manifest: HTTP ${res.status}`);
        }
        const data: NasaSvsFrame[] = await res.json();
        this.frames = data;
        this.isLoaded = true;
        return this.frames;
      } catch (err) {
        console.warn('[NasaFrameService] Error loading manifest, falling back to procedural mapping:', err);
        return [];
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Retrieves all loaded frames
   */
  public getFrames(): NasaSvsFrame[] {
    return this.frames;
  }

  /**
   * Gets the specific frame for an observation index (0 to 37)
   */
  public getFrameForIndex(index: number): NasaSvsFrame | null {
    if (this.frames.length === 0) return null;
    const clamped = Math.max(0, Math.min(this.frames.length - 2, index));
    return this.frames[clamped];
  }

  /**
   * Gets the final 3D perspective elevation column frame
   */
  public get3DTornadoFrame(): NasaSvsFrame | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.frames.length - 1];
  }

  /**
   * Gets the video URI for authentic 60fps MP4 playback
   */
  public getVideoUri(): string {
    return '/nasa_svs_5190/GISTEMP_Spiral_English_degC_2160p60.mp4';
  }

  /**
   * Sliding window preloader: Preloads ±windowSize frames around current index.
   * Evicts images outside the window from memory to avoid GPU/DOM bloat.
   */
  public preloadWindow(currentIndex: number, windowSize = 3): void {
    if (this.frames.length === 0) return;

    const start = Math.max(0, currentIndex - windowSize);
    const end = Math.min(this.frames.length - 1, currentIndex + windowSize);

    const activeUris = new Set<string>();

    for (let i = start; i <= end; i++) {
      const frame = this.frames[i];
      if (!frame) continue;

      const uri = frame.webpUri;
      activeUris.add(uri);

      if (!this.imageCache.has(uri)) {
        const img = new Image();
        img.src = uri;
        this.imageCache.set(uri, img);
      }
    }

    // Evict older images outside the active window when cache exceeds max limit
    if (this.imageCache.size > this.maxCacheSize) {
      for (const [uri] of this.imageCache) {
        if (!activeUris.has(uri)) {
          this.imageCache.delete(uri);
        }
      }
    }
  }

  /**
   * Number of currently cached images in memory
   */
  public getCachedCount(): number {
    return this.imageCache.size;
  }
}

export const nasaFrameService = new NasaFrameService();
