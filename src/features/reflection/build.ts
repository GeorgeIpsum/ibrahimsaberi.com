import { randomArrayMembers, sortArrayRandomly } from "@/utils/rand";
import { createQuestionStep } from "./components/stepper/question-step";
import { createTextStep } from "./components/stepper/text-step";
import type { Step } from "./components/stepper/types";
import type { ReflectContext } from "./context";
import { isQuestion, type Question, questions } from "./questions";

const WELCOME_ID = "welcome" as const;
const TOTAL_QUESTIONS = 15;

const buildQuestions = (ctx: ReflectContext, forceRebuild = false) => {
  const steps: Question[] = [];
  let shouldUpdate = false;

  if (ctx.qs && !forceRebuild) {
    const qs = ctx.qs.filter(({ id }) => isQuestion(id)) as Question[];
    steps.push(
      ...questions.filter((q) => {
        const questionExists = ctx.qs?.find((qq) => qq.id === q.id);
        return questionExists && questionExists.a === undefined;
      }),
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

  return {
    steps: steps.map(createQuestionStep),
    shouldUpdate,
  };
};

const buildInteractives = (ctx: ReflectContext, forceRebuild = false) => {
  return {
    steps: [],
    shouldUpdate: false,
  };
};

// biome-ignore lint/suspicious/noExplicitAny: nope
const updateSteps = async (ctx: ReflectContext, steps: Step<any>[]) => {
  const welcomeQ = ctx.qs?.find((q) => q.id === WELCOME_ID);
  const newQs = steps.map((q) => ({ id: q.id }));
  if (welcomeQ) {
    newQs.unshift(welcomeQ);
  }

  await fetch("/api/reflection", {
    method: "PUT",
    body: JSON.stringify({ ...ctx, qs: newQs }),
  })
    .then((r) => r.json())
    .then((r) => {
      const d = JSON.parse(atob(r.value));
      console.debug("question-set", d);
    });
};

const welcomeBack = [
  "welcome back.",
  "we hope you've enjoyed your respite.",
  "let's not forget what we're here for.",
  "ready to jump back in?",
  "ok. let's go.",
];
const welcome = [
  "welcome.",
  "did you know? there is no outside.",
  "all that is observed is a reflection of the observer.",
  "be honest. do you know yourself?",
  "what shape do you take?",
  "are you ready to learn?",
  "ok. let's get started.",
];

export const buildSteps = async (
  ctx: ReflectContext,
  forceRebuild = false,
  // biome-ignore lint/suspicious/noExplicitAny: im NOT sorry
): Promise<Step<any>[]> => {
  if (ctx.completed_at) {
    return [createTextStep("get lost", ["GET LOST"], true)];
  }

  const questions = buildQuestions(ctx, forceRebuild);
  const interactives = buildInteractives(ctx, forceRebuild);

  const interleavedSteps = [...questions.steps, ...interactives.steps].sort(
    (a, b) => {
      if (a.id === WELCOME_ID) return -1;
      if (b.id === WELCOME_ID) return 1;
      return Math.random() > 0.5 ? 1 : -1;
    },
  );

  if (questions.shouldUpdate || interactives.shouldUpdate) {
    await updateSteps(ctx, interleavedSteps);
  }

  return [
    createTextStep(WELCOME_ID, ctx.started_at ? welcomeBack : welcome),
    ...interleavedSteps,
    createTextStep("goodbye", ["thank you for participating."], true),
  ];
};
