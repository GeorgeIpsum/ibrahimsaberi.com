import { fastIsEqual } from "fast-is-equal";
import { ChevronsDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { TokenStream } from "@/components/text";
import { cn } from "@/css/lib";
import { useReflectionAudio } from "../audio-context";

interface TextSequenceProps {
  tokens: string[];
  onFinish?: () => void;
  onNextStart?: (completedStep: number) => void;
}
export const TextSequence: React.FC<TextSequenceProps> = ({
  tokens,
  onFinish,
  onNextStart,
}) => {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<number | [number, number]>([40, 120]);
  const [currentlyPlayingToken, setCurrentlyPlayingToken] = useState(0);
  const { nextAudio } = useReflectionAudio();

  const onComplete = () => {
    setTimeout(() => {
      setPlaying(false);
      if (!fastIsEqual(speed, [40, 120])) setSpeed([40, 120]);
    }, 500);
  };

  const moveToNextToken = () => {
    if (playing) {
      if (!fastIsEqual(speed, [10, 15])) setSpeed([10, 15]);
      return;
    }
    const nextToken = currentlyPlayingToken + 1;
    if (nextToken >= tokens.length) {
      onFinish?.();
      return;
    }
    setCurrentlyPlayingToken(nextToken);
    nextAudio?.play();
    onNextStart?.(nextToken);
    setPlaying(true);
  };

  return (
    <div className="group/sequence relative flex h-full w-full items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentlyPlayingToken}
          className="w-full text-wrap p-4 px-8 text-center md:w-1/2 md:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <TokenStream
            text={tokens[currentlyPlayingToken]}
            className="font-mono text-amber-50 lowercase"
            hideCaret
            delayMs={2000}
            speedMs={speed}
            tokenize={(text) => text.split("")}
            onComplete={onComplete}
          />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <motion.div
          className="absolute right-2 bottom-2 left-2 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Button
            variant="ghost"
            size="icon-lg"
            style={
              {
                "--bounce-distance": "-10%",
                "--animation-duration": "1.5s",
              } as React.CSSProperties
            }
            className={cn(
              "w-full px-auto transition-all duration-500",
              playing
                ? "cursor-not-allowed"
                : "animate-bounce cursor-e-resize text-amber-50",
            )}
            disabled={playing}
            onClick={moveToNextToken}
          >
            <ChevronsDown />
          </Button>
        </motion.div>
      </AnimatePresence>
      <button
        type="button"
        className={cn(
          "absolute inset-0 z-10 rounded-lg bg-transparent outline-none transition-all",
          playing
            ? "cursor-default opacity-0"
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
        onClick={moveToNextToken}
      />
    </div>
  );
};
