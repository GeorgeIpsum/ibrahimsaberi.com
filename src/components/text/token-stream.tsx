// absolutely 100% stolen from performative UI https://github.com/vorpus/performativeUI/blob/main/src/components/TokenStream.tsx
"use client";

import { fastIsEqual } from "fast-is-equal";
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/css/lib";
import { clampedNumber } from "@/utils/rand";

export interface UseTokenStreamOptions {
  text: string;
  /** [min, max] ms between tokens. Single number → fixed delay. */
  speedMs?: number | [number, number];
  /** Tokenizer: split text into atoms. Default: words+whitespace. */
  tokenize?: (text: string) => string[];
  /** ms to wait before starting the stream. */
  delayMs?: number;
  loop?: boolean;
  /** ms to wait after a full pass before clearing & restarting. */
  loopDelayMs?: number;
  onComplete?: () => void;
}

export interface UseTokenStreamResult {
  output: string;
  isStreaming: boolean;
  isComplete: boolean;
}

const defaultTokenize = (s: string) => s.split(/(\s+)/);

/**
 * Reveals `text` token-by-token. The fake AI-streaming demo.
 */
export function useTokenStream({
  text,
  speedMs = [18, 80],
  tokenize = defaultTokenize,
  loop = false,
  loopDelayMs = 6000,
  delayMs = 0,
  onComplete,
}: UseTokenStreamOptions): UseTokenStreamResult {
  const [output, setOutput] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const outputRef = useRef(output);
  const indexRef = useRef(0);
  const completedRef = useRef(false);
  const speedRef = useRef(speedMs);

  // biome-ignore lint/correctness/useExhaustiveDependencies: if tokenize changes while streaming, that would be... weird. Don't do it.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    const tokens = tokenize(text);

    // Handle speed changes
    const speedChanged = !fastIsEqual(speedRef.current, speedMs);
    speedRef.current = speedMs;
    const pickDelay = () =>
      Array.isArray(speedRef.current)
        ? clampedNumber(speedRef.current[0], speedRef.current[1])
        : speedRef.current;

    if (completedRef.current && !loop) return;

    const run = () => {
      const tick = () => {
        if (cancelled) return;
        if (indexRef.current >= tokens.length) {
          if (!completedRef.current) {
            completedRef.current = true;
            setIsComplete(true);
            onCompleteRef.current?.();
          }
          if (loop) {
            timer = setTimeout(() => {
              if (cancelled) return;
              indexRef.current = 0;
              outputRef.current = "";
              completedRef.current = false;
              setIsComplete(false);
              setOutput("");
              tick();
            }, loopDelayMs);
          }
          return;
        }
        const buf = outputRef.current + tokens[indexRef.current];
        indexRef.current += 1;
        outputRef.current = buf;
        setOutput(buf);
        timer = setTimeout(tick, pickDelay());
      };
      tick();
    };

    // Only delay on first effect run, not on speed changes
    if (delayMs && !speedChanged) {
      initialTimer = setTimeout(run, delayMs);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (initialTimer) clearTimeout(initialTimer);
    };
  }, [speedMs]);

  return { output, isStreaming: !isComplete, isComplete };
}

export interface TokenStreamProps
  extends ComponentPropsWithoutRef<"span">,
    UseTokenStreamOptions {
  /** Hide the trailing blinking caret. */
  hideCaret?: boolean;
  caretClassName?: string;
}

/**
 * Reveals text token-by-token with a trailing blinking caret. The "see it
 * think" pattern, slower on purpose.
 *
 *     <TokenStream text="Reasoning, but visibly." />
 *
 * For full control over the markup, call `useTokenStream()` directly.
 */
export const TokenStream = forwardRef<HTMLSpanElement, TokenStreamProps>(
  (
    {
      text,
      speedMs,
      tokenize,
      delayMs,
      loop,
      loopDelayMs,
      onComplete,
      hideCaret,
      className,
      caretClassName,
      ...rest
    },
    ref,
  ) => {
    const { output, isStreaming } = useTokenStream({
      text,
      speedMs,
      tokenize,
      delayMs,
      loop,
      loopDelayMs,
      onComplete,
    });
    return (
      <span ref={ref} className={cn(className)} {...rest}>
        {output}
        {!hideCaret && isStreaming && (
          <span className={cn("pui-bubble__stream-caret", caretClassName)} />
        )}
      </span>
    );
  },
);
TokenStream.displayName = "TokenStream";
