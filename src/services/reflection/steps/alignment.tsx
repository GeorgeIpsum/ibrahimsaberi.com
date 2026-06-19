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
import { playOnce } from "@/services/audio";
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
  disabled?: boolean;
}
export const Alignment: React.FC<AlignmentProps> = ({ onClick, disabled }) => {
  const { alignment } = useReflectContext();
  const [showClickMe, setShowClickMe] = useState(false);
  const { name, icon } = ALIGNMENTS[alignment as keyof typeof ALIGNMENTS] || {};

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowClickMe(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Button
        title={`BECOME: ${name}`}
        aria-label={name}
        variant="ghost"
        size="icon-xl"
        disabled={disabled}
        onClick={() => {
          onClick();
          playOnce("/audio/reflection/start.mp3");
        }}
        className="relative hover:bg-amber-500/20"
      >
        <Icon iconNode={icon} />
        <AnimatePresence>
          {!disabled && showClickMe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute top-full left-1/2 mt-2 -translate-x-1/2 transform"
              transition={{ duration: 1.5 }}
            >
              {Array.from("start").map((ch, i) => (
                <span
                  key={ch + i.toString()}
                  className="transform-3d inline-block origin-center animate-wave-travel font-mono leading-none"
                  style={
                    {
                      animationDelay: `${i * 100 - Math.exp((i + 1) / 5)}ms`,
                      "--ebb": `${-8 - Math.exp((i + 1) / 10) - Math.log(25 * (i + 2))}%`,
                      "--flow": `${4.5 + Math.log1p(i + 1) + Math.log10(50 * (i + 1))}%`,
                    } as React.CSSProperties
                  }
                >
                  {ch}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      <AnimatePresence>
        {disabled && (
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
    </>
  );
};
