"use client";

import { createContext, useContext, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverlayProps,
  useDraggable,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

import Crash from "./Crash";
import DroppableArea from "./DroppableArea";

const CrashOverlay: React.FC<React.PropsWithChildren<DragOverlayProps>> = ({
  children,
  ...props
}) =>
  createPortal(<DragOverlay {...props}>{children}</DragOverlay>, document.body);

const CrashDrag: React.FC = () => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "crash-shell",
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: 998,
  };
  return (
    <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
      <Crash />
    </div>
  );
};

const noop = () => {};

interface CrashOpts {
  dragging: boolean;
  resizing: boolean;
  anchored: boolean;
  onDrag: (...args: any) => void;
  onResize: (...args: any) => void;
  onAnchor: (...args: any) => void;
}
const CrashCtx = createContext<CrashOpts>({
  dragging: false,
  resizing: false,
  anchored: true,
  onDrag: noop,
  onResize: noop,
  onAnchor: noop,
});
const CrashCtxProvider = CrashCtx.Provider;

export const useCrash = () => useContext(CrashCtx);

const CrashContext: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [anchored, setAnchored] = useState(true);

  const onDrag = () => {
    if (!dragging) setDragging(true);
  };
  const onResize = () => {
    if (!resizing) setResizing(true);
  };
  const onAnchor = () => {};

  return (
    <DndContext>
      <CrashCtxProvider
        value={{ dragging, resizing, anchored, onDrag, onResize, onAnchor }}
      >
        {children}
      </CrashCtxProvider>
    </DndContext>
  );
};
// const CrashContext: React.FC = () => {
//   const [dragging, setDragging] = useState(false);
//   const [resizing, setResizing] = useState(false);

//   const onDragStart = () => {
//     setDragging(true);
//   };

//   const onDragEnd = (e: DragEndEvent) => {
//     console.log(e);
//     setDragging(false);
//   };

//   return (
//     <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
//       {!dragging && <CrashDrag />}
//       <CrashOverlay modifiers={[restrictToWindowEdges]}>
//         {dragging && <Crash />}
//       </CrashOverlay>
//       <DroppableArea id="snap-bottom" anchor="bottom" dragging={dragging} />
//       <DroppableArea id="snap-right" anchor="right" dragging={dragging} />
//     </DndContext>
//   );
// };

export default CrashContext;
