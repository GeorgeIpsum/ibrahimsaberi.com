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
    <>
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
            className={cn(
              "w-full px-auto transition-colors",
              playing
                ? "cursor-not-allowed"
                : "animate-pulse cursor-e-resize text-amber-50",
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
          "absolute inset-0 z-10 border-none bg-none bg-transparent opacity-0 outline-none",
          !playing ? "cursor-e-resize" : "cursor-default",
        )}
        onClick={moveToNextToken}
      />
    </>
  );
};
