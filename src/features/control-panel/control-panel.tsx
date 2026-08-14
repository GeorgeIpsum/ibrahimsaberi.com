"use client";

import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "@/components/atoms/kbd";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { cn } from "@/css/lib";
import { controlContext } from "./control-context";
import { ControlGroup } from "./control-group";
import { ControlRow } from "./control-row";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const PANEL_CONTAINER_CLASS =
  "fixed right-1/2 bottom-4 flex origin-bottom translate-x-1/2 flex-col items-center";

const PanelBody: React.FC = observer(() => (
  <>
    <h4 className="mb-2 flex w-fit gap-2 rounded border border-border bg-background-high-contrast/25 px-4 py-1 text-right font-mono font-thin text-sm backdrop-blur-lg">
      <span>control panel</span>
      <Kbd>CTRL+K</Kbd>
    </h4>
    <ScrollArea className="h-[calc(100vh-14rem)] w-[calc(100vw-2rem)] rounded-lg border border-border bg-background/80 p-4 font-mono backdrop-blur-sm md:h-64 md:w-84 lg:w-96">
      <div className="flex flex-col gap-y-1.5">
        {controlContext
          .orderedGroups()
          .map(({ id, options, entries }) =>
            options.group ? (
              <ControlGroup
                key={id}
                label={
                  typeof options.group === "string" ? options.group : "group"
                }
                defaultCollapsed={options.collapsed ?? true}
                entries={entries}
              />
            ) : (
              entries.map(([key, control]) => (
                <ControlRow key={key} controlKey={key} control={control} />
              ))
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
