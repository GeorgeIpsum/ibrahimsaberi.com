"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { TokenStream } from "@/components/text/token-stream";
import { cn } from "@/css/lib";
import {
  getReflection,
  type ReflectContext,
  ReflectProvider,
} from "../context";
import { Alignment } from "../steps/alignment";
import { Penance } from "./penance";
import { ReflectionAudio } from "./reflection-audio";

interface ReflectProps {
  searchParams: Promise<{ reason?: string }>;
}
export const Reflect_: React.FC<ReflectProps> = ({ searchParams }) => {
  const [started, setStarted] = useState(false);
  const [reflectContext, setReflectContext] = useState<ReflectContext | null>(
    null,
  );

  const start = () => {
    setStarted(true);
  };

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
              "b-8 relative flex items-center justify-center rounded-lg border backdrop-blur-lg transition-colors md:mb-0 md:max-h-[512px] md:max-w-3xl",
              started
                ? "border-amber-950/30 bg-[color-mix(in_oklch,var(--color-amber-950)_5%,#00000088_70%)]!"
                : "border-amber-300/20 bg-amber-600/20",
            )}
            initial="initial"
            animate={started ? "started" : "starting"}
          >
            <Alignment onClick={start} started={started} />
            <AnimatePresence>
              {started && (
                <motion.div className="w-full text-wrap p-4 px-8 text-center md:w-1/2 md:px-4">
                  <TokenStream
                    text="Welcome to my swamp. its a nice swamp. dont you think?"
                    className="font-mono text-amber-50 lowercase"
                    hideCaret
                    delayMs={2000}
                    speedMs={[40, 120]}
                    tokenize={(text) => text.split("")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed right-2 bottom-2 md:right-4 md:bottom-4">
        <ReflectionAudio show={started} />
      </div>
      <Suspense fallback={null}>
        <Penance searchParams={searchParams} />
      </Suspense>
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
    width: "calc(100vw - 1rem)",
    height: "calc(100vh - 8rem)",
  },
};
