"use client";

import { createContext, useContext } from "react";
import { useAudio } from "@/hooks/use-audio";

interface ReflectionAudioContext {
  nextAudio: Howl | null;
}

const ReflectionAudioContext = createContext<ReflectionAudioContext | null>(
  null,
);

export const ReflectionAudioProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const nextAudio = useAudio("/audio/reflection/next.mp3", {
    html5: false,
    preload: true,
  });

  return (
    <ReflectionAudioContext.Provider value={{ nextAudio }}>
      {children}
    </ReflectionAudioContext.Provider>
  );
};

export const useReflectionAudio = () => {
  const context = useContext(ReflectionAudioContext);
  if (!context) {
    throw new Error(
      "useReflectionAudio must be used within a ReflectionAudioProvider",
    );
  }
  return context;
};
