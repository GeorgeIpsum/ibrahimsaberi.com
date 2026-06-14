"use client";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "@/components/atoms/kbd";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { cn } from "@/css/lib";
import { ControlRenderer } from "./control";
import { controlContext } from "./control-context";

export const ControlPanel: React.FC = observer(() => {
  const [visible, setVisible] = useState(false);
  const animateEnter = useRef(visible);

  useLayoutEffect(() => {
    try {
      const stored = window.localStorage.panelVisible;
      if (stored !== undefined) {
        animateEnter.current = false;
        setVisible(stored === "true");
      }
    } catch {
      /* no-op */
    }
  }, []);

  useHotkeys("ctrl+k", () => {
    setVisible((prev) => {
      const newValue = !prev;
      animateEnter.current = true;
      try {
        window.localStorage.panelVisible = newValue ? "true" : "false";
      } catch {
        /* no-op */
      }
      return newValue;
    });
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "perspective-midrange transform-3d fixed right-1/2 bottom-4 flex origin-bottom translate-x-1/2 transform-gpu flex-col items-center",
            {
              "pointer-events-none": !visible,
            },
          )}
          initial={
            animateEnter.current
              ? {
                  opacity: 0,
                  scale: 0.95,
                  translateY: 40,
                  rotateY: -15,
                }
              : false
          }
          animate={{
            opacity: 1,
            scale: 1,
            translateY: 0,
            rotateY: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            translateY: 40,
            rotateY: -15,
          }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="mb-2 flex w-fit gap-2 rounded border border-border bg-background-high-contrast/50 px-4 py-1 text-right font-mono font-thin text-sm">
            <span>control panel</span>
            <Kbd>CTRL+K</Kbd>
          </h4>
          <ScrollArea className="flex h-[calc(100vh-14rem)] w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-border bg-secondary/80 p-4 font-mono backdrop-blur-sm md:h-64 md:w-84">
            {Object.entries(controlContext.context.registeredControls).map(
              ([key, control]) => (
                <div
                  key={key}
                  className="flex w-full items-center gap-2 text-xs"
                >
                  <div className="flex w-24 justify-end border-border border-r pr-2">
                    <h5 className="text-right font-mono font-thin text-[10px] uppercase">
                      {key}
                    </h5>
                  </div>
                  <div className="flex-1">
                    <ControlRenderer control={control} />
                  </div>
                </div>
              ),
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ControlPanel.displayName = "ControlPanel";
