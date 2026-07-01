"use client";

import { ChevronDownIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/collapsible";
import type { Control, ControlType } from "./control-context";
import { ControlRow } from "./control-row";

// Persisted collapse state is keyed by label, so multiple `group: true` groups
// (which all fall back to the same generic label) share state — give groups a
// string label when more than one is visible at once.
const storageKey = (label: string) => `controlGroup:${label}`;

/** Read persisted open state, falling back to the group's default. */
const readInitialOpen = (label: string, defaultOpen: boolean): boolean => {
  try {
    const value = window.localStorage.getItem(storageKey(label));
    if (value === "open") return true;
    if (value === "collapsed") return false;
  } catch {
    /* no-op */
  }
  return defaultOpen;
};

/** A collapsible, persisted section wrapping a group's control rows. */
export const ControlGroup: React.FC<{
  label: string;
  defaultCollapsed?: boolean;
  entries: [string, Control<ControlType>][];
}> = observer(({ label, defaultCollapsed = true, entries }) => {
  const [open, setOpen] = useState(() =>
    readInitialOpen(label, !defaultCollapsed),
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(
        storageKey(label),
        next ? "open" : "collapsed",
      );
    } catch {
      /* no-op */
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="flex flex-col gap-y-1.5"
    >
      <div className="flex w-full items-center gap-1.5">
        <div
          style={
            // math = i tried to do the math but it didnt look right so then I did part of the math and eyeballed the rest
            {
              "--cg-group-width": `calc(63px - ${label.length * 6}px)`,
              "--cg-group-width-lg": `calc(87px - ${label.length * 6}px)`,
            } as React.CSSProperties
          }
          className="h-0 w-(--cg-group-width) lg:w-(--cg-group-width-lg)"
        />
        <CollapsibleTrigger className="group ml-auto flex flex-1 cursor-pointer items-center gap-1.5 text-right font-mono font-thin text-[10px] text-muted-foreground uppercase outline-none">
          <ChevronDownIcon className="size-3 shrink-0 opacity-80 transition-transform duration-200 ease-in-out group-data-panel-open:rotate-180" />
          <span>{label}</span>
          <span className="h-px flex-1 bg-border" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-y-1.5 pt-1.5">
          {entries.map(([key, control]) => (
            <ControlRow key={key} controlKey={key} control={control} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
ControlGroup.displayName = "ControlGroup";
