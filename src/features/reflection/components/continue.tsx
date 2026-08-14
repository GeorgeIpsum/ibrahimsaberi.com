import { ChevronsDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/css/lib";

export const Continue: React.FC<{ show: boolean; onClick: () => void }> = ({
  show,
  onClick,
}) => {
  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            className="absolute right-2 bottom-2 left-2 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {
              <ChevronsDown
                className={cn(
                  "size-5 w-full transition-all duration-500 md:size-4",
                  !show
                    ? "cursor-not-allowed"
                    : "animate-bounce cursor-e-resize text-amber-50",
                )}
                style={
                  {
                    "--bounce-distance": "-10%",
                    "--animation-duration": "1.5s",
                  } as React.CSSProperties
                }
              />
            }
          </motion.div>
        )}
      </AnimatePresence>

      <button
        key="continue"
        disabled={!show}
        type="button"
        className={cn(
          "absolute inset-0 z-10 rounded-lg bg-transparent outline-none transition-all",
          !show
            ? "pointer-events-none opacity-0"
            : "gradient-border cursor-e-resize after:animate-pulse",
        )}
        style={
          {
            "--pulse-from-opacity": "0",
            "--pulse-to-opacity": "0.3",
            "--animation-duration": "3s",
            "--gradient-border-background":
              "radial-gradient(circle at bottom center, color-mix(in oklab, var(--color-amber-300) 100%, transparent 20%), transparent 80%)",
          } as React.CSSProperties
        }
        onClick={onClick}
      />
    </>
  );
};
