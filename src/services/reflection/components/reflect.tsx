"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { TokenStream } from "@/components/text/token-stream";
import { cn } from "@/css/lib";
import { sleep } from "@/utils/async";
import { useControl } from "@/utils/control-panel/use-control";
import {
  getReflection,
  type ReflectContext,
  ReflectProvider,
} from "../context";
import { ALIGNMENTS, Alignment } from "../steps/alignment";
import { Penance } from "./penance";
import { ReflectionAudio } from "./reflection-audio";

const _DEBUG_RESET_ALIGNMENT = async (
  reflectKey: string,
  alignment: number,
) => {
  const [res] = await Promise.all([
    fetch("/api/reflection", {
      method: "POST",
      body: JSON.stringify({ alignment }),
      headers: {
        "Content-Type": "application/json",
        "x-reflect": reflectKey,
      },
    }),
    // just to make the change feel less jank
    sleep(250),
  ]);
  return res;
};

interface ReflectProps {
  searchParams: Promise<{ reason?: string }>;
}
export const Reflect_: React.FC<ReflectProps> = ({ searchParams }) => {
  const [reflectKey, setReflectKey] = useState("");
  const [started, setStarted] = useState(false);
  const [reflectContext, setReflectContext] = useState<ReflectContext | null>(
    null,
  );
  const [debugAlignment, setDebugAlignment] = useState(
    reflectContext?.alignment,
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

  useEffect(() => {
    if (reflectContext) {
      setDebugAlignment(reflectContext.alignment);
    }
  }, [reflectContext]);

  useControl({
    "reflect key": {
      value: reflectKey,
      onChange: (value) => setReflectKey(value as string),
    },
    effigy: {
      value: Object.entries(ALIGNMENTS).find(
        ([key]) => Number(key) === debugAlignment,
      )?.[1].name,
      log: true,
      options: Object.values(ALIGNMENTS).map((a) => a.name),
      beforeChange: async (value, _prev, ctx) => {
        const entry = Object.entries(ALIGNMENTS).find(
          ([, a]) => a.name === value,
        );
        if (!entry) return false;
        const reflectKey = ctx.get("reflect key") as string;
        const res = await _DEBUG_RESET_ALIGNMENT(reflectKey, Number(entry[0]));
        return Boolean(res?.ok);
      },
      // Committed: mirror the new alignment locally so the panel stays in sync.
      onChange: (value) => {
        const entry = Object.entries(ALIGNMENTS).find(
          ([, a]) => a.name === value,
        );
        if (entry) {
          setReflectContext((ctx) =>
            ctx ? { ...ctx, alignment: Number(entry[0]) } : ctx,
          );
        }
      },
    },
  });

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
