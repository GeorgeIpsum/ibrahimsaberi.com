interface PlayAudioOptions {
  loop?: boolean;
}
export const createAudio = async (
  src: `/${string}`,
  options?: PlayAudioOptions,
) => {
  const existingAudio = document.querySelector(
    `audio[src="${src}"]`,
  ) as HTMLAudioElement | null;
  if (existingAudio) {
    return existingAudio;
  }

  const audio = new Audio(`/api/audio${src}`);
  audio.loop = options?.loop ?? false;

  audio.style.display = "none";
  document.body.appendChild(audio);

  return new Promise<HTMLAudioElement>((resolve, reject) => {
    audio.onloadeddata = () => {
      resolve(audio);
    };

    audio.onerror = (e) => {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error loading audio: ${src}`, e);
      }
      document.body.removeChild(audio);
      reject(new Error(`Failed to load audio: ${src}`));
    };
  });
};

export const playOnce = async (src: `/${string}`) => {
  try {
    const audio = await createAudio(src, { loop: false });
    audio.currentTime = 0;
    await audio.play();

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        audio.pause();
        document.body.removeChild(audio);
        resolve();
      };
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error playing audio: ${src}`, e);
    }
  }
};
