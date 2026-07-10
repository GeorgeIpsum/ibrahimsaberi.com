import { fastIsEqual as equals } from "fast-is-equal";
import { type IObservableValue, observable, runInAction } from "mobx";
import type { Button } from "@/components/atoms/button";
import { isLogImg, l, pL, pR, s } from "@/utils/log";

export type ControlType =
  | "select"
  | "text"
  | "color"
  | "number"
  | "switch"
  | "action";
export type ControlValue = string | number | boolean | null;
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
          : T extends "action"
            ? null
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
  label?: React.ReactElement;
  actionProps?: T extends "action"
    ? React.ComponentProps<typeof Button>
    : never;
  beforeChange?: ControlGuard<T>;
  onChange?: ControlChangeHandler<T>;
  /** Log this control's changes (commit/cancel/pending) to the console. */
  log?: boolean;
  /**
   * Save committed values to localStorage (keyed by control key alone — key
   * collisions are last-writer-wins) and restore them at registration. A saved
   * value whose type doesn't match the control is warned about and discarded.
   */
  persist?: boolean;
  /** Internal UI state: `true` while an async `beforeChange` is running. */
  pending?: boolean;
  disabled?: IObservableValue<boolean>;
  /** Sort weight within its group; lower sorts first (default 0). */
  order?: number;
};

export type ControlInput<T extends ControlType> = Omit<
  Control<T>,
  "value" | "pending" | "disabled"
> & {
  value?: ControlTypeValue<T>;
  disabled?: boolean;
};

/** Options for a `useControl` group — the controls of a single hook call. */
export interface ControlGroupOptions {
  /** Group sort weight; lower sorts first (default 0). */
  order?: number;
  /**
   * Render the group's controls in a collapsible section. A string is used as
   * the section header; `true` uses a generic fallback label.
   */
  group?: string | boolean;
  /** Initial collapse state for a collapsible group (default: collapsed). */
  collapsed?: boolean;
}

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
  if (value === null) return "action";
  return "text";
};

/** Does a (persisted) runtime value actually fit a control type? */
const valueMatchesType = (value: unknown, type: ControlType): boolean => {
  switch (type) {
    case "select":
      return typeof value === "string" || typeof value === "number";
    case "text":
    case "color":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "switch":
      return typeof value === "boolean";
    case "action":
      return value === null;
    default:
      return false;
  }
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
    case "action":
      return null as ControlTypeValue<T>;
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
  const persistFlags = new Map<K, boolean | undefined>();
  const lastProp = new Map<K, ControlValue | undefined>();
  const actionComponents = new Map<
    K,
    | Pick<React.ComponentProps<typeof Button>, "children" | "loadingIndicator">
    | undefined
  >();

  // --- ordering + grouping bookkeeping ---
  // A control belongs to a hook *instance* (one `useControl` call). Its visual
  // *group* is keyed by the group NAME when one is given, so distinct instances
  // that name the same group merge into a single section; otherwise the group
  // key is the instance id (unmerged). `seqOf`/`groupSeqOf` capture registration
  // order for stable tie-breaking and change in lockstep with the reactive
  // maps, so plain Maps suffice.
  let seqCounter = 0;
  let groupSeqCounter = 0;
  const instanceOf = new Map<K, string>(); // control key -> hook instance id
  const seqOf = new Map<K, number>(); // control key -> registration seq
  const groupSeqOf = new Map<string, number>(); // group key -> first-seen seq
  const orderMap = observable.map<K, number>(); // control key -> sort weight
  const instanceGroupKey = observable.map<string, string>(); // instance id -> group key
  const groupMeta = observable.map<string, ControlGroupOptions>(); // group key -> options

  /** Group name (if any) wins over the instance id, merging like-named groups. */
  const resolveGroupKey = (
    instanceId: string,
    options?: ControlGroupOptions,
  ): string =>
    typeof options?.group === "string" && options.group.length > 0
      ? options.group
      : instanceId;

  /** The group key a live control currently belongs to (via its instance). */
  const groupKeyOf = (key: K): string => {
    const instanceId = instanceOf.get(key);
    if (instanceId === undefined) return "";
    return instanceGroupKey.get(instanceId) ?? instanceId;
  };

  // --- localStorage persistence (`persist: true`) ---
  // Keyed by control key alone; storage is shared across contexts on purpose
  // ("who accessed this last" wins on collision).
  const persistStorageKey = (key: K) => `control:${key}`;

  /**
   * Read the saved `{type, value}` for `key`. Anything malformed or whose type
   * doesn't match the control's resolved type is warned about and thrown away.
   * Returns `undefined` when there is nothing (valid) to restore — a real
   * saved value is never `undefined` since it round-trips through JSON.
   */
  const readPersistedValue = (
    key: K,
    type: ControlType,
  ): ControlValue | undefined => {
    let raw: string | null;
    try {
      raw = globalThis.localStorage.getItem(persistStorageKey(key));
    } catch {
      return undefined;
    }
    if (raw === null) return undefined;

    let stored: { type?: unknown; value?: unknown } | undefined;
    try {
      stored = JSON.parse(raw);
    } catch {
      /* fall through to the discard below */
    }
    if (stored?.type === type && valueMatchesType(stored.value, type)) {
      return stored.value as ControlValue;
    }

    console.warn(
      `[control] discarding persisted value for "${key}": ${raw} does not match control type "${type}"`,
    );
    try {
      globalThis.localStorage.removeItem(persistStorageKey(key));
    } catch {
      /* no-op */
    }
    return undefined;
  };

  /** Save a committed value (no-op unless the control opted in via `persist`). */
  const persistValue = (key: K, value: ControlValue): void => {
    if (!persistFlags.get(key)) return;
    const type = context.registeredControls[key]?.type;
    if (!type) return;
    try {
      globalThis.localStorage.setItem(
        persistStorageKey(key),
        JSON.stringify({ type, value }),
      );
    } catch {
      /* no-op */
    }
  };

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
    persistFlags.set(key, control.persist);
    if (control.actionProps) {
      actionComponents.set(key, {
        children: control.actionProps.children,
        loadingIndicator: control.actionProps.loadingIndicator,
      });
    }
  };

  const registerControl = <T extends ControlType>(
    key: K,
    control: ControlInput<T>,
    instanceId?: string,
  ): void => {
    syncBehavior(key, control);

    // Bind the control to its hook instance once, capturing registration order.
    // The group key is resolved later from the instance's options (`setGroupMeta`).
    if (instanceId !== undefined && !instanceOf.has(key)) {
      instanceOf.set(key, instanceId);
      seqOf.set(key, seqCounter++);
    }
    runInAction(() => orderMap.set(key, control.order ?? 0));

    if (context.registeredControls[key]) return;

    // Resolve the type ONCE here; the renderer reads `entry.type` directly.
    const type = resolveControlType(control);
    const fallback = control.value ?? getDefaultControlValue(type);
    const restored = control.persist
      ? readPersistedValue(key, type)
      : undefined;
    const initial = restored !== undefined ? restored : fallback;
    lastProp.set(key, control.value);
    lastProp.set(`${key}_disabled` as K, control.disabled);

    let actionProps: React.ComponentProps<typeof Button> | undefined;
    if (type === "action" && control.actionProps) {
      const { children, loadingIndicator, ...rest } = control.actionProps;
      actionProps = rest as React.ComponentProps<typeof Button>;
    }

    runInAction(() => {
      context.registeredControls[key] = {
        type,
        options: control.options,
        value: observable.box(initial),
        pending: false,
        disabled: observable.box(control.disabled ?? false),
        label: control.label,
        actionProps,
      } as Control<ControlType>;
    });

    // A restored value that differs from the default is a real change from the
    // host's point of view — let it know so app state tracks the panel.
    if (restored !== undefined && !equals(restored, fallback)) {
      handlers.get(key)?.(restored, fallback, makeContext(false));
    }
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
      orderMap.set(key, control.order ?? 0);
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
        persistValue(key, control.value as ControlValue);
      }
    }

    if (
      control.disabled !== lastProp.get(`${key}_disabled` as K) &&
      !equals(control.disabled, entry.disabled?.get())
    ) {
      lastProp.set(`${key}_disabled` as K, control.disabled);
      runInAction(() => entry.disabled?.set(control.disabled as boolean));
    }

    if (control.type === "action" && control.actionProps) {
      const { children, loadingIndicator, ...rest } = control.actionProps;
      runInAction(() => {
        entry.actionProps = rest as React.ComponentProps<typeof Button>;
      });
    }

    if (control.label !== entry.label) {
      runInAction(() => {
        entry.label = control.label;
      });
    }
  };

  /**
   * Refresh an instance's group options (order/label/collapsed) — called every
   * render. Maps the instance to its resolved group key (merging like-named
   * groups) and stores the options under that key. Last writer wins for a shared
   * named group, but the write is skipped when nothing changed to avoid churn.
   */
  const setGroupMeta = (
    instanceId: string,
    options?: ControlGroupOptions,
  ): void => {
    const groupKey = resolveGroupKey(instanceId, options);
    if (!groupSeqOf.has(groupKey)) groupSeqOf.set(groupKey, groupSeqCounter++);
    const prev = groupMeta.get(groupKey);
    runInAction(() => {
      if (instanceGroupKey.get(instanceId) !== groupKey) {
        instanceGroupKey.set(instanceId, groupKey);
      }
      if (
        prev?.order !== options?.order ||
        prev?.group !== options?.group ||
        prev?.collapsed !== options?.collapsed
      ) {
        groupMeta.set(groupKey, {
          order: options?.order,
          group: options?.group,
          collapsed: options?.collapsed,
        });
      }
    });
  };

  /** Remove a control from the panel (called when the host unmounts). */
  const disposeControl = (key: K): void => {
    guards.delete(key);
    handlers.delete(key);
    logFlags.delete(key);
    persistFlags.delete(key);
    lastProp.delete(key);
    lastProp.delete(`${key}_disabled` as K);
    const instanceId = instanceOf.get(key);
    const groupKey = groupKeyOf(key);
    instanceOf.delete(key);
    seqOf.delete(key);
    runInAction(() => {
      orderMap.delete(key);
      delete context.registeredControls[key];
      const remaining = Object.keys(context.registeredControls) as K[];
      // Forget the instance once its last control is gone.
      if (
        instanceId !== undefined &&
        !remaining.some((k) => instanceOf.get(k) === instanceId)
      ) {
        instanceGroupKey.delete(instanceId);
      }
      // Drop group metadata once no live control resolves to this group key —
      // this keeps a shared named group alive until every contributor unmounts.
      // `groupSeqOf` is kept (keys are never reused) so a group's tie-break
      // order stays stable across re-registration.
      if (!remaining.some((k) => groupKeyOf(k) === groupKey)) {
        groupMeta.delete(groupKey);
      }
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
        l`${isLogImg} ${pl()}${pr(key)}\n${m(msg)}`.debug("\n", ...args);
      }
    };

    const commit = () => {
      runInAction(() => box.set(value));
      persistValue(key, value);
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
              persistValue(key, value);
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

  /**
   * Registered controls sorted by `(group weight, group registration order,
   * control weight, control registration order)` and segmented into contiguous
   * groups for rendering. Equal weights preserve registration order.
   */
  const orderedGroups = (): {
    id: string;
    options: ControlGroupOptions;
    entries: [K, Control<ControlType>][];
  }[] => {
    const keys = Object.keys(context.registeredControls) as K[];
    const sorted = keys.slice().sort((a, b) => {
      const ga = groupKeyOf(a);
      const gb = groupKeyOf(b);
      const goa = groupMeta.get(ga)?.order ?? 0;
      const gob = groupMeta.get(gb)?.order ?? 0;
      if (goa !== gob) return goa - gob;
      const gsa = groupSeqOf.get(ga) ?? 0;
      const gsb = groupSeqOf.get(gb) ?? 0;
      if (gsa !== gsb) return gsa - gsb;
      const oa = orderMap.get(a) ?? 0;
      const ob = orderMap.get(b) ?? 0;
      if (oa !== ob) return oa - ob;
      return (seqOf.get(a) ?? 0) - (seqOf.get(b) ?? 0);
    });

    const segments: {
      id: string;
      options: ControlGroupOptions;
      entries: [K, Control<ControlType>][];
    }[] = [];
    for (const key of sorted) {
      const id = groupKeyOf(key);
      const control = context.registeredControls[key];
      const last = segments[segments.length - 1];
      if (last && last.id === id) {
        last.entries.push([key, control]);
      } else {
        segments.push({
          id,
          options: groupMeta.get(id) ?? {},
          entries: [[key, control]],
        });
      }
    }
    return segments;
  };

  const getActionComponents = (
    key: K,
  ): React.ComponentProps<typeof Button> | undefined => {
    return actionComponents.get(key);
  };

  return {
    context,
    registerControl,
    updateControl,
    disposeControl,
    setControlValue,
    setGroupMeta,
    orderedGroups,
    getActionComponents,
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

// styled log fns
const pl = () =>
  pL("CONTROL", {
    backgroundColor: "darkolivegreen",
    color: "white",
    borderBottomLeftRadius: 0,
  });
const pr = (key: string) =>
  pR(key.toUpperCase(), {
    paddingLeft: 16,
    paddingRight: 16,
    color: "wheat",
    backgroundColor: "darkgreen",
    borderLeft: "2px solid darkseagreen",
  });
const m = (msg: string) =>
  s(msg, {
    marginLeft: 29.5,
    lineHeight: "20px",
    backgroundColor: "darkolivegreen",
    paddingLeft: 12,
    paddingRight: 12,
    color: "oldlace",
    borderBottomLeftRadius: "0.5em",
    borderBottomRightRadius: "0.5em",
    fontFamily: "system-ui",
    marginBottom: 4,
  });
