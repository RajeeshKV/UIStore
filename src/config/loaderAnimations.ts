export interface LoaderAnimationSet {
  /** Public directory containing this brand's frame images. */
  basePath: string;
  /** Ordered frame file names. Add or remove frames here; playback follows the list length. */
  frames: readonly string[];
  /** Delay between frames in milliseconds. */
  frameDuration?: number;
  label: string;
}

const numberedFrames = (count: number, extension = "png") =>
  Array.from({ length: count }, (_, index) => `frame_${String(index + 1).padStart(2, "0")}.${extension}`);

/**
 * Brand animation registry. Add a directory under public/loader/<brand>/, list
 * its ordered frames, then select its key with ACTIVE_LOADER_BRAND.
 */
export const loaderAnimations: Record<string, LoaderAnimationSet> = {
  shopey: {
    basePath: "/loader/shopey",
    frames: numberedFrames(12),
    frameDuration: 85,
    label: "Loading Shopey",
  },
};

/** Change this one value to switch the loader used by the application. */
export const ACTIVE_LOADER_BRAND = "shopey";

export function getLoaderAnimation(brand = ACTIVE_LOADER_BRAND): LoaderAnimationSet {
  return loaderAnimations[brand] ?? loaderAnimations[ACTIVE_LOADER_BRAND];
}
