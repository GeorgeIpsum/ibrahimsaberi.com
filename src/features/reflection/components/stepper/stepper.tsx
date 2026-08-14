"use client";

import { FastForward, SkipForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { cn } from "@/css/lib";
import { useReflectionAudio } from "../../audio-context";
import { StepperContext, useStepperContext } from "./context";
import type { Step } from "./types";

const StepRenderer: React.FC<Step> = ({
  id,
  transition = {},
  render,
  ...props
}) => {
  const Component = render;
  const { speedSettings } = useStepperContext();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        className="flex h-full w-full flex-col items-center justify-center gap-4 text-wrap px-2 pt-16 pb-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 1.5 / speedSettings.speedMultiplier,
          ease: "easeIn",
          ...transition,
        }}
      >
        <Component key={id} {...props} />
      </motion.div>
    </AnimatePresence>
  );
};

interface SequencerProps {
  initialIndex?: number;
  steps: Step[];
  onFinish?: (
    index: number,
    stepResults: { [key: string]: { result: unknown } },
  ) => void;
  onStepStart?: (index: number) => void;
  onStepEnd?: (index: number, result?: unknown) => void;
  canSkip?: boolean;
}
export const Stepper: React.FC<SequencerProps> = ({
  initialIndex = 0,
  steps,
  onFinish,
  onStepStart,
  onStepEnd,
  canSkip,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const completedSteps = useRef<{ [key: string]: { result: unknown } }>({});
  const { nextAudio } = useReflectionAudio();
  const [speedSettings, setSpeedSettings] = useState(getLocalSpeed());

  const currentStep = steps[currentIndex];

  // biome-ignore lint/correctness/useExhaustiveDependencies: dont change onStart please and thank you
  useEffect(() => {
    const step = steps[currentIndex];
    if (step) {
      step.onStepStart?.(currentIndex);
      onStepStart?.(currentIndex);
    }
  }, [currentIndex]);

  const next = async (result?: unknown) => {
    nextAudio?.play();

    const currentKey = currentStep.id;
    completedSteps.current[currentKey] = { result };
    onStepEnd?.(currentIndex, result);
    currentStep.onStepEnd?.(currentIndex, result);

    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentIndex(nextIndex);
    } else {
      onFinish?.(currentIndex, completedSteps.current);
    }
    return true;
  };

  if (!currentStep) return null;
  const { id, transition, render, ...stepProps } = currentStep;

  const skip = () => {
    if (canSkip) {
      next();
    }
  };

  const toggleSpeed = () => {
    setSpeedSettings((prev) => {
      const newSpeed = _toggleSpeed(prev.speed);
      setLocalSpeed(newSpeed);
      return getSpeedHelpers(newSpeed);
    });
  };

  const _canSkip = canSkip && currentIndex < 1;

  return (
    <div className="group/sequence relative flex h-full w-full items-center justify-center">
      <StepperContext.Provider
        value={{
          currentIndex,
          step: currentStep,
          steps,
          next,
          speedSettings,
          toggleSpeed,
          setSpeed: (speed: readonly [number, number]) => {
            setSpeedSettings(getSpeedHelpers(speed));
            setLocalSpeed(speed);
          },
        }}
      >
        <StepRenderer
          id={id}
          transition={transition}
          render={render}
          {...stepProps}
        />
      </StepperContext.Provider>
      <div className="absolute top-2 right-2 z-11 flex items-center gap-2 font-mono uppercase">
        <AnimatePresence>
          {_canSkip && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, pointerEvents: "none" }}
              animate={{ opacity: 1, pointerEvents: "auto" }}
              exit={{ opacity: 0, pointerEvents: "none" }}
              transition={{
                duration: 1.5 / speedSettings.speedMultiplier,
                ease: "easeIn",
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                disabled={!_canSkip}
                className="font-mono text-amber-400 uppercase"
              >
                <span className="text-xs">skip</span>
                <SkipForward className="size-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSpeed}
          className={cn(
            "gap-2 text-xs",
            speedSettings.isDefault ? "text-amber-50/40" : "text-amber-50",
          )}
        >
          <span>
            {speedSettings.speedMultiplier}
            {!speedSettings.isCustom ? "X" : ""}
          </span>
          <FastForward className="size-3" />
        </Button>
      </div>
    </div>
  );
};

const SET_SPEEDS = {
  normal: [40, 120],
  fast: [20, 60],
  fastest: [10, 30],
} as const;

const _toggleSpeed = (
  currentSpeed: readonly [number, number],
): readonly [number, number] => {
  if (currentSpeed === SET_SPEEDS.normal) {
    return SET_SPEEDS.fast;
  } else if (currentSpeed === SET_SPEEDS.fast) {
    return SET_SPEEDS.fastest;
  } else {
    return SET_SPEEDS.normal;
  }
};

const setLocalSpeed = (speed: readonly [number, number]) => {
  let speedVal = "normal";
  if (speed === SET_SPEEDS.fast) {
    speedVal = "fast";
  } else if (speed === SET_SPEEDS.fastest) {
    speedVal = "fastest";
  }
  localStorage.setItem("reflection.textSpeed", speedVal);
};

const getSpeedHelpers = (speed: readonly [number, number]) => {
  if (speed === SET_SPEEDS.fast) {
    return {
      speed,
      speedName: "fast",
      speedMultiplier: 2,
    };
  } else if (speed === SET_SPEEDS.fastest) {
    return {
      speed,
      speedName: "fastest",
      speedMultiplier: 4,
    };
  } else if (speed === SET_SPEEDS.normal) {
    return {
      speed,
      speedName: "normal",
      speedMultiplier: 1,
      isDefault: true,
    };
  } else {
    return {
      speed,
      speedName: "custom",
      speedMultiplier: Math.round(SET_SPEEDS.normal[0] / speed[0]),
      isCustom: true,
    };
  }
};

const getLocalSpeed = () => {
  if (typeof window === "undefined") {
    return getSpeedHelpers(SET_SPEEDS.normal);
  }

  const speed = localStorage.getItem("reflection.textSpeed");
  const mapped = () => {
    if (speed === "fast") {
      return SET_SPEEDS.fast;
    } else if (speed === "fastest") {
      return SET_SPEEDS.fastest;
    } else {
      return SET_SPEEDS.normal;
    }
  };
  return getSpeedHelpers(mapped());
};
