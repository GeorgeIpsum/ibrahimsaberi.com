"use client";

import { ChevronsDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/css/lib";
import { useReflectionAudio } from "../../audio-context";
import { TextStream } from "../text-stream";
import { useStepperContext } from "./context";
import type { Step } from "./types";

interface TextStepProps {
  text: string[];
  isFinal?: boolean;
}
export const TextStep: React.FC<TextStepProps> = ({ text, isFinal }) => {
  const { next, speedSettings } = useStepperContext<TextStepProps>();
  const { nextAudio } = useReflectionAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextEnabled, setNextEnabled] = useState(false);
  const speedSets = useRef<(readonly [number, number])[]>([]);

  useEffect(() => {
    speedSets.current = [...speedSets.current, speedSettings.speed];
  }, [speedSettings]);

  const enableNext = () => {
    setNextEnabled(true);
  };

  const moveNext = () => {
    nextAudio?.play();
    if (currentIndex < text.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setNextEnabled(false);
    } else {
      next({ speeds: speedSets.current });
    }
  };

  useHotkeys("space", moveNext, {
    description: "Move to the next step",
    enabled: nextEnabled && !isFinal,
    ignoreModifiers: true,
  });
  useHotkeys("enter", moveNext, {
    description: "Move to the next step",
    enabled: nextEnabled && !isFinal,
    ignoreModifiers: true,
  });

  const onComplete = () => {
    enableNext();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5 / speedSettings.speedMultiplier,
            ease: "easeIn",
          }}
          className="w-full"
        >
          <TextStream
            key={currentIndex}
            text={text[currentIndex]}
            className="mb-16 font-mono text-amber-50 lowercase"
            hideCaret
            delayMs={2000}
            speedMs={speedSettings.speed as [number, number]}
            tokenize={(text) => text.split("")}
            onComplete={onComplete}
          />
        </motion.div>
      </AnimatePresence>
      {!isFinal && (
        <AnimatePresence>
          <motion.div
            className="absolute right-2 bottom-2 left-2 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {
              <ChevronsDown
                className={cn(
                  "size-5 w-full transition-all duration-500 md:size-4",
                  !nextEnabled
                    ? "cursor-not-allowed"
                    : "animate-bounce cursor-e-resize text-amber-50",
                )}
                style={
                  {
                    "--bounce-distance": "-10%",
                    "--animation-duration": "1.5s",
                  } as React.CSSProperties
                }
              />
            }
          </motion.div>
        </AnimatePresence>
      )}
      <button
        disabled={!nextEnabled || isFinal}
        type="button"
        className={cn(
          "absolute inset-0 z-10 rounded-lg bg-transparent outline-none transition-all",
          !nextEnabled
            ? "cursor-default opacity-0"
            : "gradient-border cursor-e-resize after:animate-pulse",
        )}
        style={
          {
            "--pulse-from-opacity": "0",
            "--pulse-to-opacity": "0.3",
            "--animation-duration": "3s",
            "--gradient-border-background":
              "radial-gradient(circle at bottom center, color-mix(in oklab, var(--color-amber-300) 100%, transparent 20%), transparent 80%)",
          } as React.CSSProperties
        }
        onClick={moveNext}
      />
    </>
  );
};

export const createTextStep = (
  id: string,
  text: string[],
  isFinal?: boolean,
): Step<TextStepProps> => ({
  id,
  render: TextStep,
  text,
  isFinal,
});
