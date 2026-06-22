import { createTextStep } from "./components/stepper/text-step";
import type { Step } from "./components/stepper/types";
import type { ReflectContext } from "./context";
import { questions } from "./questions";

const buildSteps = (ctx: ReflectContext) => {
  // if (ctx.completed_at) {
  //   return [];
  // }

  return [
    createTextStep("welcome", [
      ctx.started_at ? "welcome back." : "welcome.",
      "lorem ipsum dolor sit amet consectetur adipisicing elit. asperiores, voluptate.",
      "before we begin, a quick note: this isn't a test. there are no right or wrong answers. just be honest with yourself and have fun.",
      "are you ready to begin?",
      "ok. let's get started.",
    ]),
  ];
};

// biome-ignore lint/suspicious/noExplicitAny: im sorry
export const buildOrRestoreSteps = (ctx: ReflectContext): Step<any>[] => {
  return buildSteps(ctx);
};
