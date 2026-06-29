"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { toastManager } from "@/components/atoms/toast";
import { cn } from "@/css/lib";
import { playOnce } from "@/features/audio";
import { useControl } from "@/features/control-panel";
import { sleep } from "@/utils/async";
import { randomArrayMember } from "@/utils/rand";
import { ReflectionAudioProvider } from "./audio-context";
import { buildOrRestoreSteps } from "./build";
import { ALIGNMENTS, Alignment } from "./components/alignment";
import { Penance } from "./components/penance";
import { ReflectionAudio } from "./components/reflection-audio";
import { type Step, Stepper } from "./components/stepper";
import { getReflection, type ReflectContext, ReflectProvider } from "./context";

interface ReflectProps {
  searchParams: Promise<{ reason?: string }>;
}
export const Reflect_: React.FC<ReflectProps> = ({ searchParams }) => {
  const [started, setStarted] = useState(false);
  const [reflectContext, setReflectContext] = useState<ReflectContext | null>(
    null,
  );
  const [steps, setSteps] = useState<Step[] | null>(null);

  // ctrl panel state
  const [reflectKey, setReflectKey] = useState("");
  const [debugAlignment, setDebugAlignment] = useState(
    reflectContext?.alignment,
  );

  const start = () => {
    if (reflectContext?.alignment) {
      console.log(reflectContext);
      setStarted(true);
      setSteps(buildOrRestoreSteps(reflectContext));
    }
  };

  const refreshContext = async () => {
    await getReflection()
      .then(setReflectContext)
      .catch(() => {
        console.error(
          "Considering the circumstances, it's best that you just leave.",
        );
      });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: unneeded
  useEffect(() => {
    refreshContext();

    if (typeof window !== "undefined") {
      const storedKey = window.localStorage.getItem("reflectKey");
      if (storedKey) {
        setReflectKey(storedKey);
      }
    }
  }, []);

  useEffect(() => {
    if (reflectContext) {
      setDebugAlignment(reflectContext.alignment);
    }
  }, [reflectContext]);

  useControl({
    "reflect key": {
      value: reflectKey,
      onChange: (value) => {
        setReflectKey(value as string);
        window.localStorage.setItem("reflectKey", value as string);
      },
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
    "reset qs": {
      type: "action",
      value: null,
      log: true,
      disabled: !reflectContext?.qs?.some((q) => q.a !== undefined),
      // TODO: this
      beforeChange: async () => {
        await sleep(1000);
        return false;
      },
      onChange: () => {
        getReflection()
          .then(setReflectContext)
          .catch(() => {
            console.error(
              "Considering the circumstances, it's best that you just leave.",
            );
          });
      },
    },
    "reset all": {
      type: "action",
      value: null,
      log: true,
      // TODO: this
      beforeChange: async () => {
        const [res] = await Promise.all([
          fetch("/api/reflection", {
            method: "DELETE",
            headers: { "x-reflect": reflectKey },
          }),
          sleep(500),
        ]);
        return res.ok;
      },
      onChange: () => {
        getReflection()
          .then(setReflectContext)
          .catch(() => {
            console.error(
              "Considering the circumstances, it's best that you just leave.",
            );
          });
      },
    },
  });

  const showStepper = started && steps;

  const onStepEnd = async (index: number, result?: unknown) => {
    if (reflectContext && steps) {
      const resultAsString =
        typeof result === "string" ? result : JSON.stringify(result);
      const msgBuffer = new TextEncoder().encode(resultAsString);
      const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        msgBuffer,
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch("/api/reflection", {
        method: "PUT",
        body: JSON.stringify({
          alignment: reflectContext.alignment,
          ...(!("started_at" in reflectContext) && {
            started_at: new Date().toISOString(),
          }),
          ...(index === steps.length - 1 && {
            completed_at: new Date().toISOString(),
          }),
          qs: [
            {
              id: steps[index].id,
              a: hashHex,
            },
          ],
        } as Partial<ReflectContext>),
      });

      const update = await res.json();
      console.log("it", update.it);

      if (res.ok) {
        await refreshContext();
      }
    }
  };

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
              {showStepper && (
                <Stepper
                  steps={steps}
                  onStepEnd={onStepEnd}
                  canSkip={!!reflectContext?.started_at}
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
  ["In all seriousness.", "The reflect key is wrong."],
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

    if (Math.random() <= 0.15) {
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
