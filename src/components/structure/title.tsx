"use client";

import { Suspense, useState } from "react";
import { type AsciiArtPlacement, AsciiHero } from "@/components/backgrounds";
import { cn } from "@/css/lib";
import { useControl } from "@/features/control-panel/use-control";
import { useTheme } from "@/features/theme";
import {
  findPaletteKey,
  paletteKeys,
  pickPaletteByKey,
  pickRandomPalette,
} from "./title.palettes";

interface TitleProps {
  containerClassName?: string;
  className?: string;
  title?: string;
  /** Rendered as a sibling before the h1, e.g. a decorative icon. */
  adornment?: React.ReactNode;
  art?: AsciiArtPlacement;
  /**
   * Skip the ascii hero background. Used for a height-matched Suspense
   * fallback: same box and h1 line, no canvas to mount/unmount.
   */
  hideHero?: boolean;
}

export const Title: React.FC<React.PropsWithChildren<TitleProps>> = ({
  art,
  children,
  title,
  className,
  containerClassName,
  hideHero,
}) => {
  return (
    <div
      className={cn(
        "relative -mx-4 overflow-hidden rounded-xl pt-4 pb-8 md:pt-12",
        containerClassName,
      )}
    >
      {!hideHero && (
        <Suspense fallback={null}>
          <TitleHero art={art} />
        </Suspense>
      )}
      <div className="z-10 flex">
        <h1
          title={title}
          className={cn(
            "px-4",
            "text-3xl leading-12 tracking-tight",
            "rounded-br-lg bg-linear-to-b from-transparent to-background backdrop-brightness-100",
            className,
          )}
        >
          {children}
        </h1>
      </div>
    </div>
  );
};

const TitleHero: React.FC<{ art?: AsciiArtPlacement }> = ({ art }) => {
  const { theme } = useTheme();
  const [palette, setPalette] = useState(pickRandomPalette(theme));

  useControl({
    "title palette": {
      value: findPaletteKey(palette),
      options: paletteKeys,
      log: true,
      onChange: (val) => {
        const value = val as unknown as string;
        setPalette(pickPaletteByKey(value, theme));
      },
    },
  });

  return (
    <AsciiHero
      baseOpacity={palette.canvasOpacity ?? 0.2}
      fontSize={8}
      variant="bare"
      palette={palette.colors}
      spotlightOpacity={palette.spotlightOpts?.opacity ?? 0.3}
      spotlightRadius={palette.spotlightOpts?.radius ?? 8}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      art={art}
    />
  );
};
