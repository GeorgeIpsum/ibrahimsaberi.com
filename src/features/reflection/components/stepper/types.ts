import type { Transition } from "motion/react";

// biome-ignore lint/complexity/noBannedTypes: nah
export type Step<T = {}> = {
  id: string;
  transition?: Transition;
  render: React.FC<T>;
  onStepStart?: (index: number) => void;
  onStepEnd?: (index: number, result?: unknown) => void;
} & T;
