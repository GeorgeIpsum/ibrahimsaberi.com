"use client";

import { TokenStream, type TokenStreamProps } from "@/components/text";
import { cn } from "@/css/lib";
import { useStepperContext } from "./stepper/context";

export const TextStream: React.FC<
  TokenStreamProps & { containerClassName?: string }
> = ({ containerClassName, ...props }) => {
  const { speedSettings } = useStepperContext();
  return (
    <div
      className={cn(
        "mx-auto flex h-full w-full items-center justify-center md:w-1/2",
        containerClassName,
      )}
    >
      <TokenStream
        hideCaret
        delayMs={2000}
        tokenize={(text) => text.split("")}
        speedMs={speedSettings.speed as [number, number]}
        {...props}
        className={cn("font-mono text-primary lowercase", props.className)}
      />
    </div>
  );
};
