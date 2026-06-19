"use client";

import { Volume2, VolumeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { useAudioWithQuality } from "@/hooks/use-audio";

interface ReflectionAudioProps {
  show?: boolean;
}
export const ReflectionAudio: React.FC<ReflectionAudioProps> = ({
  show = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audio = useAudioWithQuality(
    {
      hq: "/audio/reflection/personality-hq.mp3",
      rq: "/audio/reflection/personality-rq.mp3",
      lq: "/audio/reflection/personality-lq.mp3",
    },
    { loop: true, html5: true, preload: false },
  );

  useEffect(() => {
    if (audio) {
      audio.on("pause", () => setIsPlaying(false));
      audio.on("play", () => setIsPlaying(true));
    }
  }, [audio]);

  useEffect(() => {
    if (show && audio) {
      audio.play();
    }
  }, [show, audio]);

  return (
    <AnimatePresence>
      {show && !!audio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Button
            variant="ghost"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="border-white/10 bg-amber-500/10 text-white hover:border-white/20 hover:bg-amber-700/20 focus-visible:border-white/30 focus-visible:bg-amber-500/20"
            onClick={() => {
              if (audio) {
                audio.playing() ? audio.pause() : audio.play();
              }
            }}
            size="icon"
          >
            {isPlaying ? <Volume2 /> : <VolumeOff />}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
