// Based on AudioWaveform from lucide-react, but with a custom animation
import { cn } from "@/css/lib";

type Props = {
  size?: number;
  playing?: boolean;
  className?: string;
};

const BARS: { d: string; delay: number }[] = [
  { d: "M2 10v3", delay: 220 },
  { d: "M6 6v11", delay: 0 },
  { d: "M10 3v18", delay: 100 },
  { d: "M14 8v7", delay: 320 },
  { d: "M18 5v13", delay: 160 },
  { d: "M22 10v3", delay: 60 },
];

export function AudioWaveform({
  size = 24,
  playing = false,
  className,
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {BARS.map((b, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static bars
          key={i}
          d={b.d}
          className={cn(playing && "animate-audio-bar")}
          style={playing ? { animationDelay: `${b.delay}ms` } : undefined}
        />
      ))}
    </svg>
  );
}
