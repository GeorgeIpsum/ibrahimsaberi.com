"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/atoms/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { cn } from "@/css/lib";
import { type HSV, hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from "./color";
import { type Control, controlContext } from "./control-context";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * HSV color picker: a saturation×brightness plane for the current hue plus a
 * hue strip. Both surfaces are pure-CSS gradient divs driven by pointer/keyboard
 * — no external library. HSV is kept in local state (not re-derived from the hex
 * on every render) so dragging through grayscale doesn't reset the hue.
 */
const ColorPicker: React.FC<{
  /** Current color as a hex string without `#`. */
  value: string;
  /** Called with the new hex (no `#`, 6 digits) on every change. */
  onChange: (hex: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)));

  // Live HSV ref so drag/key handlers read the latest axes without re-binding.
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  // Re-sync from the prop only on EXTERNAL edits (e.g. typing in the hex field);
  // our own emits set `lastEmitted`, so the round-trip doesn't fight the drag.
  const lastEmitted = useRef<string | null>(null);
  useEffect(() => {
    if (value !== lastEmitted.current) setHsv(rgbToHsv(hexToRgb(value)));
  }, [value]);

  const emit = (next: HSV) => {
    setHsv(next);
    const hex = rgbToHex(hsvToRgb(next));
    lastEmitted.current = hex;
    onChange(hex);
  };

  const startDrag =
    (onMove: (x: number, y: number, rect: DOMRect) => void) =>
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const apply = (cx: number, cy: number) =>
        onMove(cx, cy, el.getBoundingClientRect());
      apply(e.clientX, e.clientY);
      const move = (ev: PointerEvent) => apply(ev.clientX, ev.clientY);
      const up = () => {
        el.releasePointerCapture(e.pointerId);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    };

  const onSvDrag = startDrag((x, y, rect) =>
    emit({
      h: hsvRef.current.h,
      s: clamp01((x - rect.left) / rect.width),
      v: 1 - clamp01((y - rect.top) / rect.height),
    }),
  );

  const onHueDrag = startDrag((x, _y, rect) =>
    emit({
      h: clamp01((x - rect.left) / rect.width) * 360,
      s: hsvRef.current.s,
      v: hsvRef.current.v,
    }),
  );

  const onSvKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const { h, s, v } = hsvRef.current;
    if (e.key === "ArrowLeft") emit({ h, s: clamp01(s - step), v });
    else if (e.key === "ArrowRight") emit({ h, s: clamp01(s + step), v });
    else if (e.key === "ArrowUp") emit({ h, s, v: clamp01(v + step) });
    else if (e.key === "ArrowDown") emit({ h, s, v: clamp01(v - step) });
    else return;
    e.preventDefault();
  };

  const onHueKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const { h, s, v } = hsvRef.current;
    if (e.key === "ArrowLeft") emit({ h: (h - step + 360) % 360, s, v });
    else if (e.key === "ArrowRight") emit({ h: (h + step) % 360, s, v });
    else return;
    e.preventDefault();
  };

  const hex = rgbToHex(hsvToRgb(hsv));

  return (
    <div
      className={cn(
        "flex w-44 flex-col gap-2 md:w-52",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {/* saturation (x) × brightness (y) for the current hue */}
      <div
        aria-label="Saturation and brightness"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        className="relative h-28 w-full touch-none rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onKeyDown={onSvKey}
        onPointerDown={onSvDrag}
        role="slider"
        style={{
          backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>

      {/* hue */}
      <div
        aria-label="Hue"
        aria-valuemax={360}
        aria-valuemin={0}
        aria-valuenow={Math.round(hsv.h)}
        className="rgb-spectrum relative h-3 w-full touch-none rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onKeyDown={onHueKey}
        onPointerDown={onHueDrag}
        role="slider"
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${(hsv.h / 360) * 100}%` }}
        />
      </div>

      <div className="text-center font-mono text-[10px] text-muted-foreground uppercase">
        #{hex}
      </div>
    </div>
  );
};

export const ControlColor: React.FC<{
  controlKey: string;
  control: Control<"color">;
  disabled?: boolean;
}> = observer(({ controlKey, disabled, control }) => {
  const value = control.value?.get();
  const hex = typeof value === "string" ? value : "";
  const hexColor = hex ? `#${hex}` : "#FFFFFF";

  return (
    <InputGroup className="overflow-hidden">
      <InputGroupInput
        size="xs"
        disabled={disabled}
        type="text"
        aria-label="Color input hex"
        placeholder="#FFFFFF"
        value={hex}
        className="*:[input]:px-0!"
        inputClassName="text-[10px]"
        onValueChange={(next) => {
          if (!/^([0-9A-Fa-f]{1,6})$/.test(next)) return;
          controlContext.setControlValue(controlKey, next);
        }}
      />
      <InputGroupAddon className="pl-2">
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="group/color-control-panel flex h-5 items-center justify-center bg-background px-2"
              />
            }
          >
            <div
              className="perspective-distant h-3 w-5 rounded border-border border-x border-t-0 border-b group-hover/color-control-panel:-rotate-x-15 group-hover/color-control-panel:border-x-[0.75px] group-hover/color-control-panel:border-b-[0.5px]"
              style={{ backgroundColor: hexColor }}
            />
          </PopoverTrigger>
          <PopoverContent
            side="left"
            align="end"
            popoverProps={{ className: "p-2" }}
          >
            <ColorPicker
              value={hex}
              disabled={disabled}
              onChange={(next) =>
                controlContext.setControlValue(controlKey, next)
              }
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupAddon className="text-[10px]">#</InputGroupAddon>
    </InputGroup>
  );
});
ControlColor.displayName = "ControlColor";
