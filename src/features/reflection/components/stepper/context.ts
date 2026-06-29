import { createContext, useContext } from "react";
import type { Step } from "./types";

export interface StepperContextValue {
  currentIndex: number;
  step: Step;
  next: (result?: unknown) => Promise<boolean>;
  speedSettings: {
    speed: readonly [number, number];
    speedName: string;
    speedMultiplier: number;
    isDefault?: boolean;
    isCustom?: boolean;
  };
  toggleSpeed: () => void;
  setSpeed: (speed: readonly [number, number]) => void;
}

export const StepperContext = createContext<StepperContextValue | null>(null);

// biome-ignore lint/suspicious/noExplicitAny: required
export const useStepperContext = <T extends Record<any, any>>() => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepperContext must be used within a StepperProvider");
  }
  return context as StepperContextValue & { step: Step<T> };
};
