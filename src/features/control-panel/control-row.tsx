"use client";

import { LoaderCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import { cn } from "@/css/lib";
import { ControlRenderer } from "./control";
import type { Control, ControlType } from "./control-context";

/** A single label + control field row, shared by loose and grouped rendering. */
export const ControlRow: React.FC<{
  controlKey: string;
  control: Control<ControlType>;
}> = observer(({ controlKey, control }) => {
  const disabled = control.pending || control.disabled?.get();
  return (
    <div className="relative flex w-full origin-center items-center gap-2 text-xs">
      <div className="flex w-24 items-center justify-end gap-1 border-border border-r pr-2 lg:w-30">
        <div className="ml-auto flex items-center justify-end gap-1.5">
          {control.pending && (
            <LoaderCircle className="size-2.5 shrink-0 animate-spin text-muted-foreground" />
          )}
          {control.label ? (
            control.label
          ) : (
            <h5
              className={cn(
                "text-right font-mono font-thin text-[10px] uppercase",
                disabled && "opacity-50",
              )}
            >
              {controlKey}
            </h5>
          )}
        </div>
      </div>
      <div className="flex-1">
        <ControlRenderer
          controlKey={controlKey}
          control={control}
          disabled={disabled}
        />
      </div>
    </div>
  );
});
ControlRow.displayName = "ControlRow";
