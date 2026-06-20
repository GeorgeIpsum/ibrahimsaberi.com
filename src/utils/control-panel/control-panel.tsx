"use client";

import { LoaderCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "@/components/atoms/kbd";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { cn } from "@/css/lib";
import { ControlRenderer } from "./control";
import { controlContext } from "./control-context";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const PANEL_CONTAINER_CLASS =
  "perspective-midrange transform-3d fixed right-1/2 bottom-4 flex origin-bottom translate-x-1/2 transform-gpu flex-col items-center";

const PanelBody: React.FC = observer(() => (
  <>
    <h4 className="mb-2 flex w-fit gap-2 rounded border border-border bg-background-high-contrast/10 px-4 py-1 text-right font-mono font-thin text-sm backdrop-blur-lg">
      <span>control panel</span>
      <Kbd>CTRL+K</Kbd>
    </h4>
    <ScrollArea className="h-[calc(100vh-14rem)] w-[calc(100vw-2rem)] rounded-lg border border-border bg-secondary/80 p-4 font-mono backdrop-blur-sm md:h-64 md:w-84 lg:w-96">
      <div className="flex flex-col gap-y-1.5">
        {Object.entries(controlContext.context.registeredControls).map(
          ([key, control]) => (
            <div
              key={key}
              className="relative flex w-full origin-center items-center gap-2 text-xs"
            >
              <div className="flex w-24 items-center justify-end gap-1 border-border border-r pr-2 lg:w-30">
                {control.pending && (
                  <LoaderCircle className="size-2.5 shrink-0 animate-spin text-muted-foreground" />
                )}
                <h5
                  className={cn(
                    "ml-auto text-right font-mono font-thin text-[10px] uppercase",
                    control.pending && "opacity-50",
                  )}
                >
                  {key}
                </h5>
              </div>
              <div className="flex-1">
                <ControlRenderer
                  controlKey={key}
                  control={control}
                  disabled={control.pending}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </ScrollArea>
  </>
));
PanelBody.displayName = "PanelBody";

export const ControlPanel: React.FC = observer(() => {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);
  const animateEnter = useRef(false);

  useIsomorphicLayoutEffect(() => {
    try {
      animateEnter.current = false;
      setVisible(window.localStorage.panelVisible === "true");
    } catch {
      /* no-op */
    }
    setHydrated(true);
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

  if (!hydrated) {
    return (
      <div
        className={cn(PANEL_CONTAINER_CLASS, "control-panel-static")}
        aria-hidden
      >
        <PanelBody />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={PANEL_CONTAINER_CLASS}
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
          <PanelBody />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ControlPanel.displayName = "ControlPanel";
