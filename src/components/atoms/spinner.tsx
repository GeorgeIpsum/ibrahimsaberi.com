import { LoaderPinwheel } from "lucide-react";
import type React from "react";
import { cn } from "@/css/lib";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof LoaderPinwheel>): React.ReactElement {
  return (
    <LoaderPinwheel
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}
