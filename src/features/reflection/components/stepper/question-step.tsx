import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { clampedNumber, randomArrayMembers } from "@/utils/rand";
import type { Question } from "../../questions";
import { TextStream } from "../text-stream";
import { useStepperContext } from "./context";
import type { Step } from "./types";

export const QuestionStep: React.FC<{ question: Question }> = ({
  question,
}) => {
  const { next, speedSettings } = useStepperContext();
  const [showChoices, setShowChoices] = useState(false);
  const choices = useRef(
    (() => {
      const r = randomArrayMembers(question.choices, question.choose);
      r.sort();
      return r;
    })(),
  );
  const choiceIndex = useRef(
    clampedNumber(
      0,
      Math.max(
        Math.min(
          choices.current.filter((c) => c.text.length > 1)?.[0]?.text.length ??
            0,
        ) - 1,
        0,
      ),
      true,
    ),
  ).current;

  const onSelectChoice = (index: number) => {
    const choice = choices.current[index].c;
    next({ a: choice });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeIn" }}
          className="flex min-h-1/3 w-full items-center justify-center text-center"
        >
          <TextStream
            key={question.id}
            text={question.q}
            className="font-mono text-amber-50 lowercase"
            hideCaret
            delayMs={2000}
            speedMs={speedSettings.speed as [number, number]}
            tokenize={(text) => text.split("")}
            onComplete={() => setShowChoices(true)}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex h-full w-full flex-1 flex-col pb-3">
        <AnimatePresence mode="wait">
          {showChoices && (
            <motion.div className="flex h-full w-full flex-wrap items-stretch justify-center gap-2">
              {choices.current.map((choice, index) => (
                <motion.div
                  key={choice.c.join("-")}
                  className="relative w-full md:w-[calc(50%-1rem)]"
                  initial={{
                    opacity: 0,
                    pointerEvents: "none",
                    ...relProp(index),
                  }}
                  animate={{
                    opacity: 1,
                    pointerEvents: "auto",
                    top: 0,
                    bottom: 0,
                  }}
                  exit={{
                    opacity: 0,
                    pointerEvents: "none",
                    ...relProp(index),
                  }}
                  transition={{
                    duration: 1.5 / speedSettings.speedMultiplier,
                    delay: 0.25,
                    ease: "easeOut",
                  }}
                >
                  <Button
                    variant="ghost"
                    className="*:transform-3d h-full! w-full bg-conic from-black/20 via-amber-950/33 to-black/20 font-light font-mono text-amber-100/90 text-lg! lowercase transition-all! duration-150 *:transform-gpu hover:from-black/50 hover:via-amber-800/20 hover:to-black/50 hover:text-white hover:*:animate-swizzle"
                    onClick={() => onSelectChoice(index)}
                    style={
                      {
                        "--animation-duration": `${3 / speedSettings.speedMultiplier}s`,
                        "--rotation": "0deg",
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-wrap p-1">
                      {
                        choice.text[
                          Math.min(choiceIndex, choice.text.length - 1)
                        ]
                      }
                    </span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const relProp = (index: number) =>
  index / 4 >= 0.5 ? { bottom: -20 } : { top: -20 };

export const createQuestionStep = (
  question: Question,
): Step<{ question: Question }> => {
  return {
    id: question.id,
    render: QuestionStep,
    question,
  };
};
