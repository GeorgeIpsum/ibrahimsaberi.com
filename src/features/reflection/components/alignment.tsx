"use client";

import {
  bearFace, // THE DEVOURER
  bee, // THE COLLECTOR
  beetleScarab, // THE WITNESS
  butterfly, // THE SOUL
  chameleon, // THE TRICKSTER
  crab, // THE CRAB
  elephant, // THE COSMIC
  flowerLotus, // THE NYMPH
  flowerRose, // THE SACRIFICE
  flowerTulip, // THE LOVER
  foxFaceTail, // THE SHIFTER
  frogFace, // THE CREATOR
  hedgehog, // THE WARD
  horseHead, // THE WILD
  ligatureSquare, // THE UNBOUND
  owl, // THE SEER
  pacMan, // THE GLUTTON
  pacManGhost, // THE PREY
  peach, // THE IMMORTAL
  shark, // THE HUNTER
  spider, // THE WEAVER
  toast, // THE SLOTH
  unicornHead, // THE DREAMER
  waffle, // THE RIGHTEOUS
  watermelon, // THE LUXURY
  waveCircle, // THE WHISPER
  whale, // THE GUIDE
  whaleNarwhal, // THE ELUSIVE
  yinYang, // THE WAVE
} from "@lucide/lab";
import { Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Wave } from "@/components/text";
import { cn } from "@/css/lib";
import { playOnce } from "@/features/audio";
import { useReflectContext } from "../context";

export const ALIGNMENTS = {
  1: { name: "THE DEVOURER", icon: bearFace },
  2: { name: "THE COLLECTOR", icon: bee },
  3: { name: "THE WITNESS", icon: beetleScarab },
  4: { name: "THE SOUL", icon: butterfly },
  5: { name: "THE TRICKSTER", icon: chameleon },
  6: { name: "THE CRAB", icon: crab },
  7: { name: "THE COSMIC", icon: elephant },
  8: { name: "THE NYMPH", icon: flowerLotus },
  9: { name: "THE SACRIFICE", icon: flowerRose },
  10: { name: "THE LOVER", icon: flowerTulip },
  11: { name: "THE SHIFTER", icon: foxFaceTail },
  12: { name: "THE CREATOR", icon: frogFace },
  13: { name: "THE WARD", icon: hedgehog },
  14: { name: "THE WILD", icon: horseHead },
  15: { name: "THE UNBOUND", icon: ligatureSquare },
  16: { name: "THE SEER", icon: owl },
  17: { name: "THE GLUTTON", icon: pacMan },
  18: { name: "THE PREY", icon: pacManGhost },
  19: { name: "THE IMMORTAL", icon: peach },
  20: { name: "THE HUNTER", icon: shark },
  21: { name: "THE WEAVER", icon: spider },
  22: { name: "THE SLOTH", icon: toast },
  23: { name: "THE DREAMER", icon: unicornHead },
  24: { name: "THE RIGHTEOUS", icon: waffle },
  25: { name: "THE LUXURY", icon: watermelon },
  28: { name: "THE WHISPER", icon: waveCircle },
  27: { name: "THE GUIDE", icon: whale },
  26: { name: "THE ELUSIVE", icon: whaleNarwhal },
  29: { name: "THE WAVE", icon: yinYang },
};

interface AlignmentProps {
  onClick: () => void;
  started?: boolean;
  loading?: boolean;
}
export const Alignment: React.FC<AlignmentProps> = ({
  onClick,
  started,
  loading,
}) => {
  const { alignment, started_at } = useReflectContext();
  const [showClickMe, setShowClickMe] = useState(false);
  const { name, icon } = ALIGNMENTS[alignment as keyof typeof ALIGNMENTS] || {};

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowClickMe(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      layout
      className={cn(
        "transform-3d flex transform-gpu items-center justify-center",
        started && "absolute top-1 left-1 cursor-help",
      )}
      transition={{
        duration: 0.1,
        type: "spring",
        damping: 100,
        stiffness: 500,
        ease: "linear",
      }}
      title={
        started
          ? "EFFIGY OF THE SELF: your reflection.\n\ta basis.\n\ta basin.\n\ta mirror.\n\ta mold."
          : undefined
      }
    >
      <Button
        title={`ARRIVE: ${name}`}
        aria-label={name}
        variant="ghost"
        size="icon-xl"
        disabled={started || loading}
        loading={loading}
        onClick={() => {
          onClick();
          playOnce("/audio/reflection/start.mp3");
        }}
        className="relative hover:bg-amber-500/20"
      >
        <Icon iconNode={icon} />
        <AnimatePresence>
          {!started && showClickMe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute top-full left-1/2 mt-2 -translate-x-1/2 transform"
              transition={{ duration: 1.5 }}
            >
              <Wave
                text={started_at ? "continue" : "start"}
                className="font-mono"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      <AnimatePresence>
        {started && (
          <motion.div
            className="pointer-events-none select-none font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, delay: 1 }}
          >
            {name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
