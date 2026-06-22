import { createContext, useContext } from "react";
import type { Step } from "./types";

export interface StepperContextValue {
  currentIndex: number;
  step: Step;
  next: (result?: unknown) => Promise<boolean>;
}

export const StepperContext = createContext<StepperContextValue | undefined>(
  undefined,
);

// biome-ignore lint/suspicious/noExplicitAny: required
export const useStepperContext = <T extends Record<any, any>>() => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepperContext must be used within a StepperProvider");
  }
  return context as StepperContextValue & { step: Step<T> };
};
