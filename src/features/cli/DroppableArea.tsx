"use client";

import { useDroppable } from "@dnd-kit/core";
import { cx } from "class-variance-authority";

interface DroppableAreaProps {
  id: string;
  anchor: "right" | "bottom";
  dragging?: boolean;
}
const DroppableArea: React.FC<React.PropsWithChildren<DroppableAreaProps>> = ({
  children,
  id,
  anchor,
  dragging = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style =
    anchor === "bottom"
      ? { bottom: 0, left: 0, right: 0, height: 40, zIndex: 997 }
      : { top: 0, bottom: 0, right: 0, width: 40, zIndex: 997 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style }}
      className={cx(
        "drop-area fixed sm:block",
        isOver && "hover",
        dragging && "dragging"
      )}
    >
      {children}
    </div>
  );
};

export default DroppableArea;
