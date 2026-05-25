import { Howl, type HowlOptions } from "howler";

export const createAudio = (
  src: `/${string}`,
  options?: Omit<HowlOptions, "src">,
) => {
  const audio = new Howl({
    src: [src],
    format: ["mp3"],
    ...options,
  });

  return audio;
};

export const playOnce = async (src: `/${string}`) => {
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
