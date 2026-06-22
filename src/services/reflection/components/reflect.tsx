"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { toastManager } from "@/components/atoms/toast";
import { cn } from "@/css/lib";
import { playOnce } from "@/services/audio/play";
import { sleep } from "@/utils/async";
import { useControl } from "@/utils/control-panel/use-control";
import { randomArrayMember } from "@/utils/rand";
import { ReflectionAudioProvider } from "../audio-context";
import {
  getReflection,
  type ReflectContext,
  ReflectProvider,
} from "../context";
import { ALIGNMENTS, Alignment } from "../steps/alignment";
import { Penance } from "./penance";
import { ReflectionAudio } from "./reflection-audio";
import { TextSequence } from "./text-sequence";

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
        return Boolean(res.ok);
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
      <ReflectionAudioProvider>
        <AnimatePresence>
          {!!reflectContext && (
            <motion.div
              variants={variants}
              className={cn(
                "b-8 relative flex items-center justify-center rounded-lg border backdrop-blur-lg transition-colors md:mb-0 md:max-h-[512px] md:max-w-3xl",
                started
                  ? "border-amber-950/30 bg-[color-mix(in_oklch,var(--color-amber-950)_5%,#00000088_70%)]!"
                  : "border-amber-300/20 bg-amber-800/10",
              )}
              initial="initial"
              animate={started ? "started" : "starting"}
            >
              <Alignment onClick={start} started={started} />
              {started && (
                <TextSequence
                  tokens={[
                    "The room is dimly lit, shadows dancing on the walls as a storm rages outside.",
                    "In the center of the room, a solitary figure sits at a table, their face obscured by the flickering candlelight.",
                    "As you approach, they look up, their eyes reflecting a deep well of sorrow and regret.",
                    "They speak in a voice that is barely above a whisper, recounting the choices they've made and the paths they didn't take.",
                    "With each word, you can feel the weight of their remorse and the longing for redemption.",
                    "The air grows heavy with emotion as they share their story, hoping that by confronting their past, they can find a glimmer of hope for the future.",
                  ]}
                  onFinish={() => {
                    console.log("complete");
                  }}
                  onNextStart={(step) => {
                    console.log("next step", step);
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="fixed right-2 bottom-2 md:right-4 md:bottom-4">
          <ReflectionAudio show={started} />
        </div>
        <Suspense fallback={null}>
          <Penance searchParams={searchParams} />
        </Suspense>
      </ReflectionAudioProvider>
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

const toastFailures = [
  ["AN EFFIGY OF THE SELF", "do you deny it? and wouldst deny fate itself?"],
  ["...", "..."],
  ["MALEVOLENT FUTURES", "destiny awaits us all"],
  ["Hmm...", "all action is reaction"],
  ["An end to an end", "what must be discovered?"],
  ["Decay treats one poorly", "the stalwart flame flickers"],
  ["Again", "wrapped in ember fire"],
  ["And?", "what did you learn?"],
  ["Once more...", "discover what lies beyond"],
  ["With feeling now.", "fire flies, fire falls"],
  ["❤️‍🔥", "your spirit alone continues"],
] as const;

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
    sleep(333),
  ]);

  if (!res.ok) {
    const [title, description] = randomArrayMember(toastFailures);

    if (Math.random() <= 0.1) {
      const searchParams = new URLSearchParams({
        hero: "ember spirit",
        voiceline: description,
      });
      playOnce(`/api/audio/voice-responses?${searchParams.toString()}`);
    }

    toastManager.add({
      type: "error",
      title,
      description,
      timeout: 2500,
    });
  }

  return res;
};
