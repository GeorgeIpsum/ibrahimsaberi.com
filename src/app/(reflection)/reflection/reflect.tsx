"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/css/lib";
import { getReflection, type ReflectContext, ReflectProvider } from "./context";
import { ReflectionAudio } from "./reflection-audio";
import { Alignment } from "./steps/alignment";

export const Reflect_: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [reflectContext, setReflectContext] = useState<ReflectContext | null>(
    null,
  );

  const start = () => setStarted(true);

  useEffect(() => {
    getReflection()
      .then(setReflectContext)
      .catch(() => {
        console.error(
          "Considering the circumstances, it's best that you just leave.",
        );
      });
  }, []);

  return (
    <ReflectProvider value={reflectContext}>
      <AnimatePresence>
        {!!reflectContext && (
          <motion.div
            variants={variants}
            className={cn(
              "flex items-center justify-center rounded-lg border backdrop-blur-lg transition-colors md:max-h-[512px] md:max-w-3xl",
              started
                ? "border-amber-950/30 bg-[color-mix(in_oklch,var(--color-amber-950)_5%,#00000088_70%)]!"
                : "border-amber-300/20 bg-amber-600/20",
            )}
            initial="initial"
            animate={started ? "started" : "starting"}
          >
            {!started && <Alignment onClick={start} />}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed right-2 bottom-2 md:right-4 md:bottom-4">
        <ReflectionAudio show={started} />
      </div>
    </ReflectProvider>
  );
};

const variants: Variants = {
  initial: {
    opacity: 0,
  },
  starting: {
    opacity: 1,
    width: 40,
    height: 40,
  },
  started: {
    opacity: 1,
    width: "calc(100vw - 4rem)",
    height: "calc(100vh - 8rem)",
  },
};
