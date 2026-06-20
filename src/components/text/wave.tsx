import { cn } from "@/css/lib";

type WaveColor = `${number}px ${number}px #${string}`;
type ThemedWaveColor = {
  light: WaveColor;
  dark: WaveColor;
};

const extractColor = (c: WaveColor | ThemedWaveColor) => {
  if (typeof c !== "string" && "light" in c && "dark" in c) {
    return `light-dark(drop-shadow(${c.light}), drop-shadow(${c.dark}))`;
  } else {
    return `drop-shadow(${c})`;
  }
};

interface WaveProps {
  text: string;
  className?: string;
  animateOnHover?: boolean;
  delay?: number | ((index: number) => number);
  ebb?: string | number | ((index: number) => string);
  flow?: string | number | ((index: number) => string);
  colors?: {
    above?: WaveColor | ThemedWaveColor;
    below?: WaveColor | ThemedWaveColor;
  };
  style?: React.CSSProperties;
}
export const Wave: React.FC<WaveProps> = ({
  text,
  className,
  animateOnHover,
  delay = (i) => i * 100 - Math.exp((i + 1) / 5),
  ebb = (i) => `${-8 - Math.exp((i + 1) / 10) - Math.log(25 * (i + 2))}%`,
  flow = (i) => `${4.5 + Math.log1p(i + 1) + Math.log10(50 * (i + 1))}%`,
  colors = {},
  style = {},
}) => {
  const colorStyles = {
    ...(colors.above && {
      "--wave-shadow-above": extractColor(colors.above),
    }),
    ...(colors.below && {
      "--wave-shadow-below": extractColor(colors.below),
    }),
  };

  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span
          key={ch + i.toString()}
          className={cn(
            "transform-3d inline-block origin-center leading-none",
            className,
            animateOnHover
              ? "hover:animate-wave-travel"
              : "animate-wave-travel",
          )}
          style={
            {
              animationDelay: `${typeof delay === "function" ? delay(i) : delay}ms`,
              "--ebb": typeof ebb === "function" ? ebb(i) : ebb,
              "--flow": typeof flow === "function" ? flow(i) : flow,
              ...colorStyles,
              ...style,
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </>
  );
};
