"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useReflectionAudio } from "../../audio-context";
import { StepperContext } from "./context";
import type { Step } from "./types";

const StepRenderer: React.FC<Step> = ({
  id,
  transition = {},
  render,
  ...props
}) => {
  const Component = render;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        className="w-full text-wrap p-4 px-8 text-center md:w-1/2 md:px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 1.5,
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
}
export const Stepper: React.FC<SequencerProps> = ({
  initialIndex = 0,
  steps,
  onFinish,
  onStepStart,
  onStepEnd,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const completedSteps = useRef<{ [key: string]: { result: unknown } }>({});
  const { nextAudio } = useReflectionAudio();

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

  return (
    <div className="group/sequence relative flex h-full w-full items-center justify-center">
      <StepperContext.Provider
        value={{
          currentIndex,
          step: currentStep,
          next,
        }}
      >
        <StepRenderer
          id={id}
          transition={transition}
          render={render}
          {...stepProps}
        />
      </StepperContext.Provider>
    </div>
  );
};
