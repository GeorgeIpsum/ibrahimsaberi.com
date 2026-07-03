import { randomArrayMembers, sortArrayRandomly } from "@/utils/rand";
import { createQuestionStep } from "./components/stepper/question-step";
import { createTextStep } from "./components/stepper/text-step";
import type { Step } from "./components/stepper/types";
import type { ReflectContext } from "./context";
import { isQuestion, type Question, questions } from "./questions";

const WELCOME_ID = "welcome" as const;
const TOTAL_QUESTIONS = 15;

const buildQuestions = async (ctx: ReflectContext, forceRebuild = false) => {
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

const buildInteractives = async (
  ctx: ReflectContext,
  forceRebuild = false,
) => {};

const welcomeBack = [
  "welcome back.",
  "we hope you've enjoyed your respite.",
  "let's not forget what we're here for.",
  "ready to jump back in?",
  "ok. let's go.",
];
const welcome = [
  "welcome",
  "be honest. do you know yourself?",
  "the outside is merely a reflection of the inside.",
  "are you ready to reflect?",
  "ok. let's get started.",
];

export const buildSteps = async (
  ctx: ReflectContext,
  forceRebuild = false,
  // biome-ignore lint/suspicious/noExplicitAny: im NOT sorry
): Promise<Step<any>[]> => {
  return [
    createTextStep(WELCOME_ID, ctx.started_at ? welcomeBack : welcome),
    ...(await buildQuestions(ctx, forceRebuild)),
    createTextStep("goodbye", ["thank you for participating."], true),
  ];
};
