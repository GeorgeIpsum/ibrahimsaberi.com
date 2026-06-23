"use client";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/atoms/spinner";
import { cn } from "@/css/lib";

interface LoadingTextProps {
  className?: string;
  interval?: number;
  /**
   * I have no idea why you would even use this component if you don't want this
   */
  noEllipsis?: boolean;
}
export const LoadingText: React.FC<
  React.PropsWithChildren<LoadingTextProps>
> = ({ children, className, noEllipsis = false, interval = 500 }) => {
  const [ellipsis, setEllipsis] = useState("...");

  useEffect(() => {
    if (noEllipsis) return;
    const intervalId = setInterval(() => {
      setEllipsis((prev) => (prev.length < 3 ? `${prev}.` : ""));
    }, interval);
    return () => clearInterval(intervalId);
  }, [noEllipsis, interval]);

  return (
    <span
      className={cn(
        "absolute inset-0 inline-flex w-full items-center justify-center gap-2 text-primary-foreground",
        className,
      )}
    >
      <Spinner />
      <span className="inline-flex items-center gap-0">
        {children}
        {!noEllipsis && <span className="w-3 text-left">{ellipsis}</span>}
      </span>
    </span>
  );
};
