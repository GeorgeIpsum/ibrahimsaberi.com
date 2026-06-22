"use client";

import { useEffect, useRef, useState } from "react";
import { useNetworkQuality } from "@/hooks/use-network-quality";
import {
  type AudioLink,
  type AudioOptions,
  createAudio,
  type Howl,
} from "@/services/audio";
import {
  type QualitySources,
  selectAudioQuality,
} from "@/services/audio/select-quality";

export const useAudio = (link: AudioLink, options?: AudioOptions) => {
  const [audio, setAudio] = useState<Howl | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  if (
    optionsRef.current?.preload &&
    !optionsRef.current?.format &&
    ["mp3", "ogg", "wav"].some((fmt) => link.endsWith(fmt))
  ) {
    optionsRef.current.format = [link.split(".").pop() as string];
  }

  useEffect(() => {
    const audioInstance = createAudio(link, optionsRef.current);
    audioInstance.once("load", () => {
      setAudio(audioInstance);
    });

    audioInstance.on("loaderror", (_, error) => {
      console.warn("Audio load error:", error);
    });

    if (optionsRef.current?.preload) {
      audioInstance.load();
    }

    return () => {
      audioInstance.off();
      audioInstance.unload();
      setAudio(null);
    };
  }, [link]);

  return audio;
};

export const useAudioWithQuality = (
  sources: QualitySources,
  options?: AudioOptions,
) => {
  // Only the status tier matters here, so subscribe to just that slice — this
  // consumer re-renders on tier changes, not on every 10s metric tick.
  const networkStatus = useNetworkQuality((q) => q.status);
  const [audio, setAudio] = useState<Howl | null>(null);

  // sources/options are typically inline literals (new refs every render). The
  // audio loads exactly once, so read them through refs instead of making them
  // effect deps — otherwise every render would reload and, with html5: true,
  // exhaust Howler's HTML5 audio pool.
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Commit a single source the first time the network status settles (leaves
  // "checking"). Locked in afterwards, so later status changes don't reload.
  const [committedSource, setCommittedSource] = useState<AudioLink | null>(
    null,
  );
  useEffect(() => {
    if (committedSource !== null || networkStatus === "checking") return;
    setCommittedSource(selectAudioQuality(sourcesRef.current, networkStatus));
  }, [networkStatus, committedSource]);

  // Create exactly one instance for the committed source, and unload on
  // unmount. Keyed only on the committed source, so the Howl stays a stable
  // reference and its pooled HTML5 audio node is released when the component
  // goes away. The instance is surfaced immediately (not on "load") so a
  // consumer can render controls and trigger playback — required with
  // preload: false, where the file isn't fetched until the first play().
  useEffect(() => {
    if (committedSource === null) return;
    const instance = createAudio(committedSource, optionsRef.current);
    instance.on("loaderror", (id, error) => {
      console.error("Audio load error:", id, error);
    });
    setAudio(instance);
    return () => {
      instance.off();
      instance.unload();
      setAudio(null);
    };
  }, [committedSource]);

  return audio;
};
