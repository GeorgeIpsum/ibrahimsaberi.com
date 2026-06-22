"use client";

import { ChevronsDown, FastForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { TokenStream } from "@/components/text";
import { cn } from "@/css/lib";
import { useReflectionAudio } from "../../audio-context";
import { useStepperContext } from "./context";
import type { Step } from "./types";

interface TextStepProps {
  text: string[];
}
export const TextStep: React.FC<TextStepProps> = ({ text }) => {
  const { next } = useStepperContext<TextStepProps>();
  const { nextAudio } = useReflectionAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const normalSpeed = useRef<[number, number]>([40, 120]).current;
  const fastSpeed = useRef<[number, number]>([20, 60]).current;
  const fastestSpeed = useRef<[number, number]>([10, 30]).current;
  const [speed, setSpeed] = useState(normalSpeed);
  const speedSets = useRef<[number, number][]>([]);

  const enableNext = () => {
    setNextEnabled(true);
  };

  const toggleSpeed = () => {
    setSpeed((prev) => {
      const newSpeed =
        prev === normalSpeed
          ? fastSpeed
          : prev === fastSpeed
            ? fastestSpeed
            : normalSpeed;
      speedSets.current.push(newSpeed);
      return newSpeed;
    });
  };

  const moveNext = () => {
    if (completed) {
      next({ speeds: speedSets.current });
    } else {
      nextAudio?.play();
      if (currentIndex < text.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setNextEnabled(false);
      } else {
        setCompleted(true);
      }
    }
  };

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
          transition={{ duration: 1.5, ease: "easeIn" }}
        >
          <TokenStream
            key={currentIndex}
            text={text[currentIndex]}
            className="font-mono text-amber-50 lowercase"
            hideCaret
            delayMs={2000}
            speedMs={speed}
            tokenize={(text) => text.split("")}
            onComplete={onComplete}
          />
        </motion.div>
      </AnimatePresence>
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
      <button
        disabled={!nextEnabled}
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
      <div className="absolute top-2 right-2 z-11 flex items-center gap-2 font-mono uppercase">
        <div className="text-xs">
          {speed === normalSpeed
            ? ""
            : speed === fastSpeed
              ? "2X"
              : speed === fastestSpeed
                ? "4X"
                : "custom"}
        </div>
        <Button variant="ghost" size="sm" onClick={toggleSpeed}>
          <FastForward />
        </Button>
      </div>
    </>
  );
};

export const createTextStep = (
  id: string,
  text: string[],
): Step<TextStepProps> => ({
  id,
  render: TextStep,
  text,
});
