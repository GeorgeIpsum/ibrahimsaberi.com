import chroma from "chroma-js";
import { ChevronsDown } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { CurvedText, type CurvedTextPhase } from "@/components/text";
import { cn } from "@/css/lib";
import {
  clampedNumber,
  coinFlip,
  randomArrayMember,
  randomArrayMembers,
} from "@/utils/rand";
import { carvingColor, type Question } from "../../questions";
import { TextStream } from "../text-stream";
import { useStepperContext } from "./context";
import type { Step } from "./types";

const INTRO_STYLES = [
  "top-bottom",
  "left-right",
  "ess",
  "spiral",
  "shuriken",
] as const;
type IntroStyleName = (typeof INTRO_STYLES)[number];
interface IntroStyle {
  name: IntroStyleName;
  staggered: boolean;
  reversed: boolean;
}

const pickRandomStyle = (total: number): IntroStyle => {
  // const name = "shuriken";
  const name =
    total < 4
      ? randomArrayMember(INTRO_STYLES.slice(0, 3))
      : randomArrayMember(INTRO_STYLES);

  return {
    name,
    staggered: true, //coinFlip(),
    reversed: coinFlip(),
  };
};

export const QuestionStep: React.FC<{ question: Question }> = ({
  question,
}) => {
  const { next, speedSettings } = useStepperContext();
  const [showChoices, setShowChoices] = useState(false);
  const [chosenChoice, setChosenChoice] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<CurvedTextPhase>("flat");
  const [size, setSize] = useState(180);
  const [sequenceDone, setSequenceDone] = useState(false);
  const choiceStyle = useRef(pickRandomStyle(question.choose));
  const startTime = useRef(Date.now());
  const [f] = useState(1);

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
    setChosenChoice(choices.current[index].c);
  };

  // The deliberate hold between the cylinder settling and the ring morph.
  const ringHold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoMove = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (ringHold.current) clearTimeout(ringHold.current);
      if (autoMove.current) clearTimeout(autoMove.current);
    },
    [],
  );

  const moveNext = () => {
    if (chosenChoice) {
      next({
        a: {
          c: chosenChoice,
          t: Date.now() - startTime.current,
          s: choiceStyle.current,
        },
      });
    }
  };

  const canMoveNext = useMemo(
    () => !!chosenChoice && sequenceDone,
    [chosenChoice, sequenceDone],
  );

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "ring" ? 0.1 : 1 }}
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

      <div className="relative flex h-full w-full flex-1 flex-col pb-3">
        <AnimatePresence mode="wait">
          {showChoices && (
            <motion.div className="flex h-full w-full flex-wrap items-stretch justify-center gap-2">
              {choices.current.map((choice, index) => {
                const isChosen = chosenChoice === choice.c;
                const choiceText =
                  choice.text[Math.min(choiceIndex, choice.text.length - 1)];

                return (
                  <motion.div
                    layout="position"
                    variants={choiceVariants}
                    custom={
                      {
                        index,
                        total: question.choose,
                        style: choiceStyle.current,
                        speedMultiplier: speedSettings.speedMultiplier,
                      } satisfies VariantParams
                    }
                    key={choice.c.join("-")}
                    className={cn(
                      "w-full",
                      isChosen
                        ? "fixed z-10 mx-auto mt-6 h-[calc(100%-4rem)] self-center overflow-hidden md:w-1/2"
                        : "relative h-30 md:h-32 md:w-[calc(50%-1rem)]",
                      isChosen &&
                        "bg-linear-[180deg,var(--background)_0%,transparent_30%] bg-size-[100%_400%] bg-no-repeat",
                    )}
                    initial="beforeEnter"
                    animate={
                      !chosenChoice
                        ? "pickPhase"
                        : !isChosen
                          ? "exit"
                          : phase === "ring"
                            ? "chosenRing"
                            : "chosen"
                    }
                    onAnimationStart={(definition) => {
                      if (definition === "chosen") {
                        setPhase("cylinder");
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "relative flex h-full! w-full flex-col items-center justify-center bg-conic from-black/20 via-amber-950/33 to-black/20 font-light font-mono text-amber-100/90 lowercase",
                        !chosenChoice
                          ? "*:transform-3d transition-all! duration-150 *:transform-gpu hover:bg-black/90 hover:text-white hover:*:animate-swizzle"
                          : "border-none",
                      )}
                      onClick={() => onSelectChoice(index)}
                      disabled={!!chosenChoice}
                      style={
                        {
                          "--animation-duration": `${3 / speedSettings.speedMultiplier}s`,
                          "--rotation": "0deg",
                        } as React.CSSProperties
                      }
                    >
                      <span className="text-wrap p-1">
                        <CurvedText
                          className="w-full text-wrap"
                          phase={phase}
                          // note: we add the extra space so wrapping doesnt look wonky when phase changes
                          text={`${choiceText} `}
                          size={size}
                          morphDuration={2}
                          sizeTransition={{
                            stagger: true,
                            staggerDuration: 0.1,
                            delay: 1.5,
                            duration: 3,
                          }}
                          onPhaseComplete={(completed) => {
                            if (!isChosen || completed !== "cylinder") return;
                            ringHold.current = setTimeout(() => {
                              setSize(24);
                            }, 3000);
                            setPhase("ring");
                          }}
                          onSizeComplete={() => {
                            if (isChosen) {
                              setSequenceDone(true);
                              autoMove.current = setTimeout(() => {
                                moveNext();
                              }, 15000);
                            }
                          }}
                        />
                      </span>
                      {isChosen && phase === "ring" && (
                        <motion.div
                          className="absolute inset-0 flex origin-center items-center justify-center"
                          initial={{ opacity: 0, scale: 0.3 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            opacity: { delay: 1, duration: 3 },
                            scale: { delay: 0, duration: 3 },
                          }}
                        >
                          <motion.div
                            className="isolate flex size-14 items-center justify-center rounded-full bg-white"
                            style={{
                              backgroundImage: choice.c
                                .map((c, i, { length }) => {
                                  const { x, y } = polarToXY(
                                    24,
                                    (i / length) * Math.PI * 2,
                                  );
                                  return `radial-gradient(at ${66 + x}% ${66 + y}% in srgb, ${carvingColor[c]} 0%, ${carvingColor[c]} 20%, transparent 40%)`;
                                })
                                // multiple background images are a comma-separated list
                                .join(", "),
                              backgroundSize: "200% 200%",
                              backgroundRepeat: "no-repeat",
                            }}
                            initial={{ backgroundPosition: "0% 0%" }}
                            animate={{
                              backgroundPosition: "66% 66%",
                              boxShadow: `0 0 8px #000000BB, ${choice.c
                                .map((c, i, { length }) => {
                                  const { x, y } = polarToXY(
                                    42,
                                    1 + (i / length) * Math.PI * 2,
                                  );
                                  return `${x}px ${y}px 64px 4px ${carvingColor[c]}AA`;
                                })
                                .join(", ")}`,
                            }}
                            transition={{ delay: 3, duration: 3 }}
                          >
                            <svg
                              gradientUnits="userSpaceOnUse"
                              className="pointer-events-none absolute"
                              width="0"
                              height="0"
                              viewBox="0 0 0 0"
                            >
                              <title>IGNORE ME PLS WTF</title>
                              <defs>
                                <linearGradient
                                  id="gradient-asdf"
                                  gradientUnits="userSpaceOnUse"
                                  gradientTransform="rotate(36)"
                                  x1="0"
                                  y1="0"
                                  x2="100%"
                                  y2="100%"
                                >
                                  {choice.c.map((c, i, { length }) => {
                                    return (
                                      <stop
                                        key={c}
                                        offset={`${Math.floor((i / length) * 100)}%`}
                                        stopColor={chroma(carvingColor[c])
                                          .set("lch.c", "*4")
                                          .darken(2)
                                          .css("oklch")}
                                        stopOpacity={1}
                                      />
                                    );
                                  })}
                                </linearGradient>
                              </defs>
                            </svg>
                            <question.Icon className="size-7 bg-clip-content stroke-1 stroke-[url(#gradient-asdf)]" />
                          </motion.div>
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {canMoveNext && (
          <motion.div
            className="absolute right-2 bottom-2 left-2 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {
              <ChevronsDown
                className={cn(
                  "size-5 w-full transition-all duration-500 md:size-4",
                  !chosenChoice
                    ? "cursor-not-allowed"
                    : "animate-bounce cursor-e-resize text-amber-50",
                )}
                style={
                  {
                    "--bounce-distance": "-10%",
                    "--animation-duration": "1.5s",
                  } as React.CSSProperties
                }
              />
            }
          </motion.div>
        )}
      </AnimatePresence>

      <button
        disabled={!canMoveNext}
        type="button"
        className={cn(
          "absolute inset-0 z-10 rounded-lg bg-transparent outline-none transition-all",
          !canMoveNext
            ? "pointer-events-none cursor-default opacity-0"
            : "gradient-border cursor-e-resize after:animate-pulse",
        )}
        style={
          {
            "--pulse-from-opacity": "0",
            "--pulse-to-opacity": "0.3",
            "--animation-duration": "3s",
            "--gradient-border-background":
              "radial-gradient(circle at bottom center, color-mix(in oklab, var(--color-amber-300) 100%, transparent 20%), transparent 80%)",
          } as React.CSSProperties
        }
        onClick={moveNext}
      />
    </>
  );
};

export const createQuestionStep = (
  question: Question,
): Step<{ question: Question }> => {
  return {
    id: question.id,
    render: QuestionStep,
    question,
  };
};

interface VariantParams {
  index: number;
  total: number;
  style: IntroStyle;
  speedMultiplier: number;
}
const choiceVariants: Variants = {
  beforeEnter: ({ index, style }: VariantParams) => {
    const base = {
      opacity: 0,
      pointerEvents: "none",
    };

    switch (style.name) {
      case "top-bottom": {
        return {
          ...base,
          ...topBottom(index),
        };
      }
      case "left-right": {
        return {
          ...base,
          ...leftRight(index),
        };
      }
      case "spiral": {
        return {
          ...base,
          ...spiral(index),
        };
      }
      case "shuriken": {
        return {
          ...base,
          ...shuriken(index),
        };
      }
      case "ess": {
        return {
          ...base,
          ...ess(index),
        };
      }
    }
  },
  pickPhase: ({ index, total, style, speedMultiplier }: VariantParams) => {
    const idx = style.reversed ? total - index - 1 : index;
    return {
      opacity: 1,
      pointerEvents: "auto",
      borderRadius: 6,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      transition: {
        duration: 0.5 + 0.5 / speedMultiplier,
        delay: 0.25 + (style.staggered ? idx * 0.5 : 0) / speedMultiplier,
        ease: "easeIn",
      },
    };
  },
  chosen: ({ speedMultiplier }: VariantParams) => ({
    opacity: 1,
    pointerEvents: "none",
    borderRadius: 6,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundPosition: "0% 0%",
    transition: {
      duration: 0.75 / speedMultiplier,
      delay: 1.5 / speedMultiplier,
    },
  }),
  chosenRing: ({ speedMultiplier }: VariantParams) => {
    const delay = 1 + 1.5 / Math.max(speedMultiplier * 0.5, 1);
    const duration = 3 + 6 / speedMultiplier;

    return {
      opacity: 1,
      pointerEvents: "none",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: "10rem",
      height: "10rem",
      borderRadius: 160,
      backgroundPosition: "0% 100%",
      transition: {
        width: {
          duration,
          delay,
        },
        height: {
          duration,
          delay,
        },
        borderRadius: {
          duration: 3,
          delay: duration / 2,
        },
        backgroundPosition: {
          duration,
          delay,
        },
      },
    };
  },
  exit: ({ speedMultiplier }: VariantParams) => ({
    opacity: 0,
    pointerEvents: "none",
    borderRadius: 6,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    transition: {
      duration: 0.75 / speedMultiplier,
    },
  }),
};

const topBottom = (index: number) =>
  index / 4 >= 0.5 ? { bottom: -20 } : { top: -20 };
const leftRight = (index: number) =>
  index % 2 === 1 ? { right: -20 } : { left: -20 };
const ess = (index: number) =>
  index / 4 >= 0.5 ? { right: -20 } : { left: -20 };
const spiral = (index: number) => {
  switch (index % 4) {
    case 0:
      return { top: -20 };
    case 1:
      return { right: -20 };
    case 2:
      return { left: -20 };
    case 3:
      return { bottom: -20 };
  }
};
const shuriken = (index: number) => {
  switch (index % 4) {
    case 0:
      return { top: -10, left: -30 };
    case 1:
      return { top: -30, right: -10 };
    case 2:
      return { bottom: -30, left: -10 };
    case 3:
      return { bottom: -10, right: -30 };
  }
};

const polarToXY = (r: number, theta: number) => {
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return { x, y };
};
