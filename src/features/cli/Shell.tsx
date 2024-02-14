"use client";

import { useCallback, useState } from "react";

import { motion, useMotionValue } from "framer-motion";

import useLocalStorage from "@/hooks/useLocalStorage";

interface ShellState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const defaultShellState: ShellState = {
  x: -20,
  y: -20,
  width: 200,
  height: 120,
};

interface ShellProps extends React.PropsWithChildren {
  anchor?: "bottom" | "right";
}
const Shell: React.FC<ShellProps> = ({ children, anchor }) => {
  const [resizing, setResizing] = useState(false);
  const [shellState, setShellState] = useLocalStorage({
    key: "shell-state",
    defaultValue: defaultShellState,
  });
  const width = useMotionValue(shellState.width);
  const height = useMotionValue(shellState.height);

  const onDrag = useCallback((_: DragEvent, info: {}) => {
    console.log(info);
  }, []);

  return (
    <motion.div
      style={{
        width,
        height,
        position: "relative",
      }}
    >
      {children}
      <motion.div
        style={{
          height: 20,
          width: 20,
          cursor: "nwse-resize",
          background: "red",
          position: "absolute",
          bottom: -20,
          right: -20,
        }}
        onDrag={onDrag}
        drag
        dragMomentum={false}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={() => setResizing(true)}
        onDragEnd={() => setResizing(false)}
      />
    </motion.div>
  );
};

export default Shell;
