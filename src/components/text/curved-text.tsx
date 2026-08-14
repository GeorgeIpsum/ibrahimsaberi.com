"use client";

import {
  animate,
  type MotionValue,
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  type LetterGeometry,
  letterOpacity,
  letterTransform,
  ringAngleDeg,
  tiltTransform,
} from "./curved-text-geometry";

export type CurvedTextPhase = "flat" | "cylinder" | "ring";

export interface CurvedTextSizeTransition {
  /** Ripple the size change through the text one character at a time. */
  stagger?: boolean;
  /** Seconds between each letter starting its size animation (with stagger). Default 0.05. */
  staggerDuration?: number;
  /** Seconds to wait before the size transition starts. Default 0. */
  delay?: number;
  /** Perceptual duration in seconds of the size spring; omit for the default spring physics. */
  duration?: number;
}

export interface CurvedTextProps {
  text: string;
  /** Controlled morph target; transitions animate through intermediate phases. */
  phase: CurvedTextPhase;
  /** Ring/cylinder diameter in px. */
  size?: number;
  /** Seconds per revolution. */
  spinDuration?: number;
  /** Seconds per unit of phase distance (flat→ring covers two units). */
  morphDuration?: number;
  /** How size changes animate. Omit for the default spring, all letters at once. */
  sizeTransition?: CurvedTextSizeTransition;
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers";
  /** Fires when the morph to `phase` finishes. Not fired for interrupted morphs or on mount. */
  onPhaseComplete?: (phase: CurvedTextPhase) => void;
  /** Fires once every letter's size animation has settled after a `size` change. Not fired on mount. */
  onSizeComplete?: () => void;
  className?: string;
}

const PHASE_PROGRESS: Record<CurvedTextPhase, number> = {
  flat: 0,
  cylinder: 1,
  ring: 2,
};

const HOVER_MULTIPLIER: Record<
  NonNullable<CurvedTextProps["onHover"]>,
  number
> = {
  slowDown: 0.5,
  speedUp: 4,
  pause: 0,
  goBonkers: 20,
};

const SPRING = { type: "spring", damping: 20, stiffness: 300 } as const;

interface CurvedLetterProps {
  letter: string;
  geometry: Omit<LetterGeometry, "radius">;
  targetRadius: number;
  /** Seconds to wait before this letter's radius spring starts. */
  delay: number;
  /** Perceptual spring duration in seconds; undefined = default spring physics. */
  duration: number | undefined;
  progress: MotionValue<number>;
  spin: MotionValue<number>;
  /** Stable callback invoked when this letter's size animation finishes (not when interrupted). */
  onSettled: () => void;
}

const CurvedLetter = ({
  letter,
  geometry,
  targetRadius,
  delay,
  duration,
  progress,
  spin,
  onSettled,
}: CurvedLetterProps) => {
  const radius = useMotionValue(targetRadius);

  // biome-ignore lint/correctness/useExhaustiveDependencies: radius is a stable motion value; onSettled is identity-stable by contract
  useEffect(() => {
    const controls = animate(radius, targetRadius, {
      ...(duration ? { type: "spring" as const, duration } : SPRING),
      delay,
      onComplete: onSettled,
    });
    return () => controls.stop();
  }, [targetRadius, delay, duration]);

  const transform = useTransform([progress, radius], ([p, r]: number[]) =>
    letterTransform(p, { ...geometry, radius: r }),
  );
  const opacity = useTransform(
    [progress, spin, radius],
    ([p, s, r]: number[]) => letterOpacity(p, s, { ...geometry, radius: r }),
  );

  return (
    <motion.span
      className="absolute top-1/2 left-1/2 inline-block whitespace-pre"
      style={{ transform, opacity }}
    >
      {letter}
    </motion.span>
  );
};

export const CurvedText = ({
  text,
  phase,
  size = 200,
  spinDuration = 20,
  morphDuration = 1.2,
  sizeTransition,
  onHover = "speedUp",
  onPhaseComplete,
  onSizeComplete,
  className = "",
}: CurvedTextProps) => {
  const letters = Array.from(text);
  const count = letters.length;
  // Destructured to primitives so a fresh object literal per render can't
  // retrigger the animation effects below.
  const {
    stagger = false,
    staggerDuration = 0.05,
    delay: sizeDelay = 0,
    duration: sizeDuration,
  } = sizeTransition ?? {};

  const radius = useMotionValue(size / 2);
  const progress = useMotionValue(PHASE_PROGRESS[phase]);
  const spin = useMotionValue(0);
  const scale = useMotionValue(1);
  const [flatOffsets, setFlatOffsets] = useState<
    { x: number; y: number }[] | null
  >(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const hoverMultiplier = useRef(1);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Completion callbacks are read through refs so consumers can pass fresh
  // closures every render without retriggering the animation effects.
  const onPhaseCompleteRef = useRef(onPhaseComplete);
  onPhaseCompleteRef.current = onPhaseComplete;
  const onSizeCompleteRef = useRef(onSizeComplete);
  onSizeCompleteRef.current = onSizeComplete;
  const countRef = useRef(count);
  countRef.current = count;
  const settledLetters = useRef(0);
  // Armed only by a real size change, so instantly-completing mount
  // animations never fire onSizeComplete.
  const sizeSettleArmed = useRef(false);
  const prevSize = useRef(size);

  const handleLetterSettled = useRef(() => {
    if (!sizeSettleArmed.current) return;
    settledLetters.current += 1;
    if (settledLetters.current >= countRef.current) {
      sizeSettleArmed.current = false;
      onSizeCompleteRef.current?.();
    }
  }).current;

  // Measure natural per-letter offsets from the hidden flat copy so the flat
  // state keeps real letter spacing instead of circumference-stretched spacing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: text is a stable string identity for rendering
  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const midX = el.offsetWidth / 2;
      const midY = el.offsetHeight / 2;
      setFlatOffsets(
        Array.from(el.children, (child) => {
          const span = child as HTMLElement;
          return {
            x: span.offsetLeft + span.offsetWidth / 2 - midX,
            y: span.offsetTop + span.offsetHeight / 2 - midY,
          };
        }),
      );
    };
    measure();
    // Glyph metrics shift when webfonts finish loading.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [text, size]);

  // Size changes animate the whole apparatus; the flat wrap layout itself
  // re-flows discretely at the target width (wrapping can't interpolate).
  // The container box never staggers — only the letters do.
  // biome-ignore lint/correctness/useExhaustiveDependencies: radius is a stable motion value
  useEffect(() => {
    if (prevSize.current !== size) {
      prevSize.current = size;
      settledLetters.current = 0;
      sizeSettleArmed.current = true;
    }
    const controls = animate(radius, size / 2, {
      ...(sizeDuration
        ? { type: "spring" as const, duration: sizeDuration }
        : SPRING),
      delay: sizeDelay,
    });
    return () => controls.stop();
  }, [size, sizeDelay, sizeDuration]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: progress is a stable motion value
  useEffect(() => {
    const target = PHASE_PROGRESS[phase];
    // Already at the target (e.g. mount): nothing to morph, no completion.
    if (progress.get() === target) return;
    const controls = animate(progress, target, {
      duration: morphDuration * Math.abs(target - progress.get()),
      ease: "easeInOut",
      onComplete: () => onPhaseCompleteRef.current?.(phase),
    });
    return () => controls.stop();
  }, [phase, morphDuration]);

  // In the flat phase the spin settles forward to the next full turn so the
  // span sits still and aligned; useAnimationFrame below is what spins the
  // other phases.
  // biome-ignore lint/correctness/useExhaustiveDependencies: spin is a stable motion value
  useEffect(() => {
    if (phase !== "flat") return;
    const controls = animate(spin, Math.ceil(spin.get() / 360) * 360, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [phase]);

  useAnimationFrame((_, delta) => {
    if (phaseRef.current === "flat") return;
    spin.set(
      spin.get() +
        (delta / 1000) * (360 / spinDuration) * hoverMultiplier.current,
    );
  });

  const handleHoverStart = () => {
    if (phaseRef.current === "flat") return;
    hoverMultiplier.current = HOVER_MULTIPLIER[onHover];
    if (onHover === "goBonkers") animate(scale, 0.8, SPRING);
  };

  const handleHoverEnd = () => {
    hoverMultiplier.current = 1;
    animate(scale, 1, SPRING);
  };

  const tilt = useTransform([progress, radius], ([p, r]: number[]) =>
    tiltTransform(p, r),
  );
  const spinner = useTransform(spin, (s) => `rotateY(${s}deg)`);
  const boxSize = useTransform(radius, (r) => r * 2);
  const perspective = useTransform(radius, (r) => r * 8);

  return (
    <motion.div
      role="img"
      aria-label={text}
      className={`relative ${className}`}
      style={{ width: boxSize, height: boxSize, perspective, scale }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {/* Plain inline spans so the copy wraps at natural word boundaries,
          exactly like the text would as a normal block at this width. */}
      {/* Fixed at the TARGET width so a mid-animation measure never captures
          a transient wrap layout. */}
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute top-0 block whitespace-pre-wrap"
        style={{ width: size }}
      >
        {letters.map((letter, i) => (
          <span key={`measure-${i.toString()}`}>{letter}</span>
        ))}
      </span>
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ transform: tilt, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transform: spinner, transformStyle: "preserve-3d" }}
        >
          {flatOffsets?.length === count &&
            letters.map((letter, i) => (
              <CurvedLetter
                key={`letter-${i.toString()}`}
                letter={letter}
                geometry={{
                  flatX: flatOffsets[i].x,
                  flatY: flatOffsets[i].y,
                  ringAngleDeg: ringAngleDeg(i, count),
                }}
                targetRadius={size / 2}
                delay={sizeDelay + (stagger ? i * staggerDuration : 0)}
                duration={sizeDuration}
                progress={progress}
                spin={spin}
                onSettled={handleLetterSettled}
              />
            ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
