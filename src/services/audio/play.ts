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

export const playOnce = async (src: AudioLink) => {
  try {
    const audio = createAudio(src, {
      autoplay: true,
      loop: false,
      format: ["mp3"],
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
