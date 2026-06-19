import { cn } from "@/css/lib";

interface WaveProps {
  text: string;
  className?: string;
  animateOnHover?: boolean;
}
export const Wave: React.FC<WaveProps> = ({
  text,
  className,
  animateOnHover,
}) => {
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
              animationDelay: `${i * 100 - Math.exp((i + 1) / 5)}ms`,
              "--ebb": `${-8 - Math.exp((i + 1) / 10) - Math.log(25 * (i + 2))}%`,
              "--flow": `${4.5 + Math.log1p(i + 1) + Math.log10(50 * (i + 1))}%`,
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </>
  );
};
