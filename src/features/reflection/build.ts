import { randomArrayMembers, sortArrayRandomly } from "@/utils/rand";
import { createQuestionStep } from "./components/stepper/question-step";
import { createTextStep } from "./components/stepper/text-step";
import type { Step } from "./components/stepper/types";
import type { ReflectContext } from "./context";
import { type Question, questions } from "./questions";

const WELCOME_ID = "welcome" as const;
const FILTERED_IDS: string[] = [WELCOME_ID];
const TOTAL_QUESTIONS = 15;

const buildQuestions = async (ctx: ReflectContext, forceRebuild = false) => {
  const steps: Question[] = [];
  let shouldUpdate = false;

  if (ctx.qs && !forceRebuild) {
    const qs = ctx.qs
      .map((q) =>
        questions.find((qq) => qq.id === q.id && !FILTERED_IDS.includes(qq.id)),
      )
      .filter(Boolean) as Question[];
    steps.push(
      ...qs.filter(
        (q) => ctx.qs?.find((qq) => qq.id === q.id)?.a === undefined,
      ),
    );

    if (qs.length < TOTAL_QUESTIONS) {
      shouldUpdate = true;
      steps.push(
        ...randomArrayMembers(
          questions.filter((q) => !qs.includes(q)),
          TOTAL_QUESTIONS - qs.length,
        ),
      );
    }
  } else {
    shouldUpdate = true;
    steps.push(...randomArrayMembers(questions, TOTAL_QUESTIONS));
    steps.sort(sortArrayRandomly);
  }

  if (shouldUpdate) {
    const newQs = steps.map((q) => ({ id: q.id }));
    const welcome = ctx.qs?.find((q) => q.id === WELCOME_ID);
    if (welcome) {
      newQs.unshift(welcome);
    }
    await fetch("/api/reflection", {
      method: "PUT",
      body: JSON.stringify({ ...ctx, qs: newQs }),
    })
      .then((r) => r.json())
      .then((r) => {
        // if (forceRebuild) {
        const d = JSON.parse(atob(r.value));
        console.debug("question-set", d);
        // }
      });
  }

  return steps.map(createQuestionStep);
};

export const buildSteps = async (
  ctx: ReflectContext,
  forceRebuild = false,
  // biome-ignore lint/suspicious/noExplicitAny: im sorry
): Promise<Step<any>[]> => {
  return [
    createTextStep(WELCOME_ID, [
      ctx.started_at ? "welcome back." : "welcome.",
      ctx.started_at ? "swag" : "bag",
      "before we begin, a quick note: this isn't a test. there are no right or wrong answers. just be honest with yourself and have fun.",
      "are you ready to begin?",
      "ok. let's get started.",
    ]),
    ...(await buildQuestions(ctx, forceRebuild)),
    createTextStep("goodbye", ["thank you for participating."], true),
  ];
};
