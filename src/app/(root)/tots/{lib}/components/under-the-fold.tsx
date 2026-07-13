"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ToolGroupOpts, Tool as ToolKind } from "../types";
import { Tool } from "./tool";

export const UnderTheFold: React.FC<{
  tools: ToolKind[];
  opts: ToolGroupOpts;
}> = ({ tools, opts }) => {
  const [show, setShow] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  if (tools.length === 0) return null;

  const toggle = () => {
    setIsChanging(true);
    if (show) {
      setShow(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {show &&
          tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: i * 0.1 } }}
              exit={{ opacity: 0, transition: { delay: 1 - i * 0.1 } }}
            >
              <Tool tool={tool} opts={opts} />
            </motion.div>
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {!isChanging && (
          <motion.button
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0, duration: 0.1 } }}
            className="w-fit text-left text-muted-foreground"
            onClick={toggle}
            onAnimationComplete={() => {
              if (!show) {
                setShow(true);
              }
            }}
          >
            {show ? "Hide" : `Show ${tools.length} more`}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
