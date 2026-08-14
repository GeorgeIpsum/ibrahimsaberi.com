import { cn } from "@/css/lib";
import { NotFound } from "./not-found";

interface HFNotFoundProps {
  className?: string;
}
export const HFNotFound: React.FC<React.PropsWithChildren<HFNotFoundProps>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex h-[calc(100svh-12rem)] w-full items-center justify-center",
        className,
      )}
    >
      <NotFound>{children}</NotFound>
    </div>
  );
};
