"use client";

import { Icon, MirrorRectangular } from "lucide-react";
import { useEffect, useState } from "react";
import { getReflection } from "../context";
import { ALIGNMENTS } from "../steps/alignment";

interface NavSwapProps {
  className?: string;
}
export const NavSwap: React.FC<NavSwapProps> = ({ className }) => {
  const [alignment, setAlignment] = useState<keyof typeof ALIGNMENTS>();

  useEffect(() => {
    getReflection(true)
      .then((reflection) => {
        setAlignment(reflection?.alignment as keyof typeof ALIGNMENTS);
      })
      .catch(() => {
        setAlignment(undefined);
      });
  }, []);

  if (alignment) {
    const { icon, name } = ALIGNMENTS[alignment];

    return icon ? (
      <Icon className={className} aria-label={name} iconNode={icon} />
    ) : (
      <MirrorRectangular className={className} />
    );
  }

  return <MirrorRectangular className={className} />;
};
