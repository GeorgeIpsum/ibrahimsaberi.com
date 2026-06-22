import { Howl, Howler, type HowlOptions } from "howler";

Howler.autoUnlock = true;

export type AudioLink = `/${string}` | `https://${string}`;

export const createAudio = (src: AudioLink, options?: AudioOptions) => {
  const audio = new Howl({
    src: [src],
    format: ["mp3"],
    ...options,
  });

  return audio;
};

/**
 * NOTE: this will NOT work unless there has already been some kind of user interaction with the page that would unlock audio playback. In practice, this means that if you call this function before the user has clicked/tapped anywhere, it will fail to play the audio. After the user has interacted with the page, this function should work as expected.
 *
 * @param src The source of the audio to play.
 * @returns Howl audio instance (not that you'd really do anything with it, we unload it immediately after it finishes playing to free up resources).
 */
export const playOnce = async (src: AudioLink) => {
  try {
    const audio = createAudio(src, {
      autoplay: true,
      loop: false,
      format: ["mp3"],
    });
    audio.once("end", () => {
      audio.unload();
    });
    return audio;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error playing audio: ${src}`, e);
    }
  }
};

export type { Howl };
export type AudioOptions = Omit<HowlOptions, "src">;
