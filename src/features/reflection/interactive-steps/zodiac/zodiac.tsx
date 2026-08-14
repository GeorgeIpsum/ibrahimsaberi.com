"use client";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { DatePicker } from "@/components/atoms/date-picker";
import { Wave } from "@/components/text";
import { cn } from "@/css/lib";
import { polarToCartesian } from "@/utils/math";
import { randomArrayMembers } from "@/utils/rand";
import { Continue } from "../../components/continue";
import type { Step } from "../../components/stepper";
import { useStepperContext } from "../../components/stepper/context";
import { TextStream } from "../../components/text-stream";
import { getSign, type ZodiacSign, zodiac } from "./lib";

export const Zodiac: React.FC = () => {
  const { next, speedSettings } = useStepperContext();
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [alts, setAlts] = useState<ZodiacSign[]>([]);

  const [streamFinished, setStreamFinished] = useState(false);
  const [hasOpenedPicker, setHasOpenedPicker] = useState(false);
  const [_showContinue, setShowContinue] = useState(false);
  const [startContinue, setStartContinue] = useState(false);

  const dateSelectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (dateSelectTimeout.current) {
        clearTimeout(dateSelectTimeout.current);
      }
    };
  }, []);

  const onDateSelect = (date: Date | undefined) => {
    setSign(date ? getSign(date) : null);
    setAlts([]);
    if (!date) {
      setShowContinue(false);
      setStartContinue(false);
    }
    if (dateSelectTimeout.current) {
      clearTimeout(dateSelectTimeout.current);
    }
    dateSelectTimeout.current = setTimeout(() => {
      setAlts(
        date
          ? randomArrayMembers(Object.keys(zodiac) as ZodiacSign[], 3, {
              exclude: [getSign(date)],
            })
          : [],
      );
      dateSelectTimeout.current = null;
    }, 1500);
  };

  const onPickerOpenChange = (open: boolean) => {
    if (open && !hasOpenedPicker) {
      setHasOpenedPicker(true);
    }
    setShowContinue(!open && sign !== null);
  };

  const showContinue = _showContinue && sign && alts;

  return (
    <>
      <AnimatePresence>
        <div className="relative flex h-full flex-col items-center justify-center gap-8 will-change-transform">
          <AnimatePresence>
            {!startContinue && (
              <motion.div
                layout
                exit={{
                  opacity: 0,
                  transition: {
                    opacity: { duration: 1.5 },
                  },
                }}
                className={
                  "flex origin-center flex-col items-center justify-end gap-8"
                }
              >
                <TextStream
                  text="and one last question. when is your birthday?"
                  onComplete={() => setStreamFinished(true)}
                  className="mb-2"
                  containerClassName="md:w-full h-8"
                />
                <div className="h-8">
                  {streamFinished && (
                    <motion.div
                      className="relative"
                      variants={zodiacVariants}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <DatePicker
                        buttonProps={{
                          variant: "ghost",
                          className: cn(
                            "w-fit self-center transition-all",
                            sign && "min-w-40",
                          ),
                        }}
                        popoverProps={{
                          className: "bg-background",
                          side: "top",
                          align: "center",
                        }}
                        className="bg-background"
                        dropdown
                        start={new Date(new Date().getFullYear(), 0, 1)}
                        end={new Date(new Date().getFullYear(), 11, 31)}
                        components={{ YearsDropdown: () => <></> }}
                        onChange={onDateSelect}
                        formatStr="MMMM d"
                        placeholder={null}
                        onOpenChange={onPickerOpenChange}
                      />
                      <AnimatePresence>
                        {!hasOpenedPicker && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: 6 } }}
                            exit={{ opacity: 0, transition: { delay: 1.5 } }}
                            transition={{ duration: 1.5 }}
                            className="absolute right-1/2 bottom-[calc(100%+0.25rem)] translate-x-1/2 whitespace-pre"
                          >
                            <Wave
                              text="click me"
                              className="font-mono text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            layout="position"
            animate={
              startContinue ? { rotate: 360, y: -30 } : { rotate: 0, y: 0 }
            }
            transition={
              startContinue
                ? {
                    rotate: { duration: 12, ease: "linear", repeat: Infinity },
                    y: { duration: 0.5 },
                    layout: { duration: 3, ease: "easeInOut" },
                  }
                : { duration: 0.5 }
            }
            // will-change pins this as the containing block for the fixed items
            // below before Motion writes its first transform frame
            className={cn(
              "flex w-full origin-center flex-wrap content-start items-center justify-center gap-12 will-change-transform max-md:min-h-1/3 md:max-w-md md:content-center md:gap-4",
              startContinue && "absolute inset-0 md:max-w-none",
            )}
          >
            {Object.entries(zodiac).map(([key, data], i) => {
              const { Icon, description, color } = data;
              const isChosen = sign === key;
              const isAlt = alts.includes(key as ZodiacSign);
              const altIndex = alts.indexOf(key as ZodiacSign);
              const { x, y } = isAlt
                ? polarToCartesian(60, (altIndex / 3) * 2 * Math.PI)
                : { x: 0, y: 0 };

              if (startContinue && !isChosen && !isAlt) {
                return null;
              }

              return (
                <motion.div
                  layout="position"
                  variants={zodiacVariants}
                  initial={"hidden"}
                  animate={
                    startContinue
                      ? "thagomizing"
                      : isChosen
                        ? "chosen"
                        : isAlt
                          ? "chosenAlt"
                          : "visible"
                  }
                  transition={{ layout: { duration: 3, ease: "easeInOut" } }}
                  custom={{
                    color,
                    index: i,
                    altIndex,
                    speedMultiplier: speedSettings.speedMultiplier,
                  }}
                  key={key}
                  title={description}
                  style={
                    {
                      "--x": `${x}px`,
                      "--y": `${y}px`,
                    } as React.CSSProperties
                  }
                  className={cn(
                    "flex size-10 cursor-help items-center justify-center rounded-full md:size-12",
                    startContinue && (isChosen || isAlt) && "fixed z-100",
                    startContinue &&
                      isChosen &&
                      "z-101 shadow-[inset_0_2px_12px_-2px_#FFFFFF66,inset_0_-6px_24px_-2px_#00000099]",
                    startContinue &&
                      isAlt &&
                      "translate-x-[calc(var(--x))] translate-y-[calc(var(--y))] shadow-[inset_0_2px_8px_#000000AA]",
                  )}
                >
                  <Icon color={color} className="size-5 md:size-6" />
                </motion.div>
              );
            })}
          </motion.div>
          <AnimatePresence>
            {!startContinue && (
              <motion.div
                layout
                exit={{
                  opacity: 0,
                  transition: { opacity: { duration: 0.5 } },
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.5 },
                }}
                style={{
                  pointerEvents: showContinue ? "auto" : "none",
                  opacity: showContinue ? 1 : 0,
                  transition: "opacity 0.5s 0.5s ease-in-out",
                }}
                className={cn("flex items-center justify-center")}
              >
                <div className="pb-16">
                  <Button
                    disabled={!showContinue}
                    size="xl"
                    variant="outline"
                    onClick={() => setStartContinue(true)}
                  >
                    SWAGGGG
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatePresence>

      <Continue show={startContinue} onClick={() => next({ sign, alts })} />
    </>
  );
};

interface ZodiacVariantParams {
  color: string;
  index: number;
  altIndex: number;
  speedMultiplier: number;
}
const zodiacVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, backgroundColor: "#000000" },
  visible: ({ color, index, speedMultiplier }: ZodiacVariantParams, old) => {
    return {
      opacity: 1,
      scale: 1,
      backgroundColor: `color-mix(in srgb, ${color} 6%, black 10%)`,
      transition: {
        duration: 0.5,
        ...(old?.opacity === 0 && {
          delay: (4.5 + index * 0.15) / speedMultiplier,
        }),
      },
    };
  },
  chosen: ({ color }: ZodiacVariantParams) => ({
    opacity: 1,
    scale: 1.04,
    rotate: 0,
    backgroundColor: `color-mix(in srgb, ${color} 36%, black 10%)`,
    transition: { duration: 0.5 },
  }),
  chosenAlt: ({ color }: ZodiacVariantParams) => ({
    opacity: 1,
    scale: 1.01,
    rotate: 0,
    backgroundColor: `color-mix(in srgb, ${color} 30%, white 99%)`,
    transition: { duration: 0.5 },
  }),
  // rotate counter to the container's spin at the same speed so the icons
  // stay upright while orbiting; a CSS animate-spin here would override
  // Motion's inline transform and kill the layout animation
  thagomizing: ({ color, altIndex }: ZodiacVariantParams) => ({
    opacity: 1,
    scale: altIndex === -1 ? 1.04 : 1.01,
    backgroundColor:
      altIndex === -1
        ? `color-mix(in srgb, ${color} 36%, black 10%)`
        : `color-mix(in srgb, ${color} 30%, white 99%)`,
    rotate: -360,
    transition: {
      duration: 6,
      rotate: { duration: 12, ease: "linear", repeat: Infinity },
      layout: { duration: 6 },
    },
  }),
};

export const zodiacStep = (): Step => ({
  id: "zodiac",
  render: Zodiac,
});
