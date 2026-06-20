import { fastIsEqual as equals } from "fast-is-equal";
import { type IObservableValue, observable, runInAction } from "mobx";
import { isLogImg, l, pL, pR, s } from "@/utils/log";

export type ControlType = "select" | "text" | "color" | "number" | "switch";
export type ControlValue = string | number | boolean;
export type ControlTypeValue<T extends ControlType> = T extends "select"
  ? string | number
  : T extends "text"
    ? string
    : T extends "color"
      ? string
      : T extends "number"
        ? number
        : T extends "switch"
          ? boolean
          : never;

/** Context handed to a control's `beforeChange`/`onChange`. */
export interface ControlChangeContext {
  fromPanel: boolean;
  /** The full registered-control map, for cross-control reads. */
  controls: { [key: string]: Control<ControlType> };
  /** Read another control's current value by key. */
  get: (key: string) => ControlValue | undefined;
}

export type ControlGuard<T extends ControlType> = (
  value: ControlTypeValue<T>,
  prev: ControlTypeValue<T>,
  context: ControlChangeContext,
  // biome-ignore lint/suspicious/noConfusingVoidType: a guard may resolve to nothing (accept) or false (cancel)
) => boolean | void | Promise<boolean | void>;

/** Called after a change is committed (i.e. after `beforeChange`, if any, passes). */
export type ControlChangeHandler<T extends ControlType> = (
  value: ControlTypeValue<T>,
  prev: ControlTypeValue<T>,
  context: ControlChangeContext,
) => void;

export type Control<T extends ControlType> = {
  type?: T;
  value: IObservableValue<ControlTypeValue<T>> | undefined;
  options?: T extends "select" ? string[] | number[] : never;
  beforeChange?: ControlGuard<T>;
  onChange?: ControlChangeHandler<T>;
  /** Log this control's changes (commit/cancel/pending) to the console. */
  log?: boolean;
  /** Internal UI state: `true` while an async `beforeChange` is running. */
  pending?: boolean;
};

export type ControlInput<T extends ControlType> = Omit<
  Control<T>,
  "value" | "pending"
> & {
  value?: ControlTypeValue<T>;
};

interface ControlContext<K extends string> {
  registeredControls: { [key in K]: Control<ControlType> };
}

/**
 * Resolve a control's concrete type ONCE, from its config + initial value.
 * Precedence: explicit `type` > presence of `options` > inference from the
 * value's runtime type (`#`-prefixed string => color) > `text`.
 */
export const resolveControlType = (control: {
  type?: ControlType;
  options?: readonly (string | number)[];
  value?: ControlValue;
}): ControlType => {
  if (control.type) return control.type;
  if (control.options) return "select";
  const { value } = control;
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (typeof value === "string" && value.startsWith("#")) return "color";
  return "text";
};

const getDefaultControlValue = <T extends ControlType>(
  type: T,
): ControlTypeValue<T> => {
  switch (type) {
    case "select":
    case "text":
    case "color":
      return "" as ControlTypeValue<T>;
    case "number":
      return 0 as ControlTypeValue<T>;
    case "switch":
      return false as ControlTypeValue<T>;
    default:
      throw new Error(`Unsupported control type: ${type}`);
  }
};

export function createControlContext<K extends string>() {
  const context: ControlContext<K> = observable({
    registeredControls: {} as { [key in K]: Control<ControlType> },
  });

  const guards = new Map<K, ControlGuard<ControlType> | undefined>();
  const handlers = new Map<K, ControlChangeHandler<ControlType> | undefined>();
  const logFlags = new Map<K, boolean | undefined>();
  const lastProp = new Map<K, ControlValue | undefined>();

  const makeContext = (fromPanel: boolean): ControlChangeContext => ({
    fromPanel,
    controls: context.registeredControls as {
      [key: string]: Control<ControlType>;
    },
    get: (key) => context.registeredControls[key as K]?.value?.get(),
  });

  /** Refresh the behavior maps from the latest config (called every render). */
  const syncBehavior = <T extends ControlType>(
    key: K,
    control: ControlInput<T>,
  ) => {
    guards.set(key, control.beforeChange as ControlGuard<ControlType>);
    handlers.set(key, control.onChange as ControlChangeHandler<ControlType>);
    logFlags.set(key, control.log);
  };

  const registerControl = <T extends ControlType>(
    key: K,
    control: ControlInput<T>,
  ): void => {
    syncBehavior(key, control);
    if (context.registeredControls[key]) return;

    // Resolve the type ONCE here; the renderer reads `entry.type` directly.
    const type = resolveControlType(control);
    const initial = control.value ?? getDefaultControlValue(type);
    lastProp.set(key, control.value);
    runInAction(() => {
      context.registeredControls[key] = {
        type,
        options: control.options,
        value: observable.box(initial),
        pending: false,
      } as Control<ControlType>;
    });
  };

  const updateControl = <T extends ControlType>(
    key: K,
    control: ControlInput<T>,
  ): void => {
    const entry = context.registeredControls[key];
    if (!entry) return;

    syncBehavior(key, control);
    // `type` is resolved once at registration and stays fixed for the control's
    // lifetime; only the option list can change on re-render.
    runInAction(() => {
      entry.options = control.options as Control<ControlType>["options"];
    });

    // Only react to a genuine prop change, so an in-flight optimistic edit
    // isn't reverted just because the host component re-rendered.
    if (
      control.value !== undefined &&
      !equals(control.value, lastProp.get(key))
    ) {
      lastProp.set(key, control.value);
      if (!equals(control.value, entry.value?.get())) {
        runInAction(() => entry.value?.set(control.value as ControlValue));
      }
    }
  };

  /** Remove a control from the panel (called when the host unmounts). */
  const disposeControl = (key: K): void => {
    guards.delete(key);
    handlers.delete(key);
    logFlags.delete(key);
    lastProp.delete(key);
    runInAction(() => {
      delete context.registeredControls[key];
    });
  };

  const setControlValue = (
    key: K,
    value: ControlValue,
    opts: { fromPanel: boolean } = { fromPanel: true },
  ): void => {
    const entry = context.registeredControls[key];
    const box = entry?.value;
    if (!box) return;

    const prev = box.get();
    if (equals(prev, value)) return;

    const ctx = makeContext(opts.fromPanel);
    const onChange = handlers.get(key);
    const guard = guards.get(key);
    const log = (msg: string, ...args: unknown[]) => {
      if (logFlags.get(key)) {
        l`${isLogImg} ${pL("CONTROL", { backgroundColor: "springgreen", color: "darkgreen", borderBottomLeftRadius: 0 })}${pR(key.toUpperCase(), { color: "wheat", backgroundColor: "darkgreen", borderLeft: "2px solid seagreen" })}\n${s(msg, { marginLeft: 29.5, lineHeight: 20, backgroundColor: "springgreen", paddingLeft: 6, paddingRight: 6, color: "black", borderBottomLeftRadius: "0.5em", borderBottomRightRadius: "0.5em", fontFamily: "system-ui", marginBottom: 4 })}`.debug(
          "\n",
          ...args,
        );
      }
    };

    const commit = () => {
      runInAction(() => box.set(value));
      log("committed", { prev, value });
      onChange?.(value, prev, ctx);
    };

    if (!guard) {
      commit();
      return;
    }

    const result = guard(value, prev, ctx);

    if (result instanceof Promise) {
      // Optimistically show the pending value while the gate runs.
      runInAction(() => {
        box.set(value);
        entry.pending = true;
      });
      log("pending", { prev, value });
      result
        .then((ok) =>
          runInAction(() => {
            // Bail if the host unmounted (and disposed us) mid-flight.
            if (context.registeredControls[key] !== entry) return;
            entry.pending = false;
            if (ok === false) {
              box.set(prev);
              log("cancelled", { prev, value });
            } else {
              log("committed", { prev, value });
              onChange?.(value, prev, ctx);
            }
          }),
        )
        .catch((err) =>
          runInAction(() => {
            if (context.registeredControls[key] !== entry) return;
            entry.pending = false;
            box.set(prev);
            log("cancelled (threw)", err);
          }),
        );
      return;
    }

    if (result === false) {
      log("cancelled", { prev, value });
      return;
    }
    commit();
  };

  return {
    context,
    registerControl,
    updateControl,
    disposeControl,
    setControlValue,
  };
}

declare global {
  var IS_controller:
    | ReturnType<typeof createControlContext<string>>
    | undefined;
}

globalThis.IS_controller =
  globalThis.IS_controller ?? createControlContext<string>();

export const controlContext = globalThis.IS_controller;
