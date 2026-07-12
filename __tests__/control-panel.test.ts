import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createControlContext,
  resolveControlType,
} from "@/features/control-panel/control-context";
import { keySetFingerprint } from "@/features/control-panel/use-control";

/** Let queued microtasks/promises settle (for async `beforeChange`). */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** In-memory localStorage stand-in (tests run in a node environment). */
const stubStorage = (seed: Record<string, string> = {}) => {
  const store = new Map<string, string>(Object.entries(seed));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
};

/**
 * Simulate a component mounting then re-rendering `n` times: register once,
 * then reconcile on every subsequent render (this is what `useControl` does).
 */
const mountAndRerender = (
  ctx: ReturnType<typeof createControlContext<string>>,
  key: string,
  // biome-ignore lint/suspicious/noExplicitAny: test config bag
  config: any,
  rerenders: number,
) => {
  ctx.registerControl(key, config);
  for (let i = 0; i < rerenders; i++) ctx.updateControl(key, config);
};

describe("control panel store", () => {
  it("fires onChange exactly once per change, regardless of re-renders", () => {
    // The original bug: every render re-registered the control and leaked a
    // reaction, so one edit fired onChange once per accumulated render.
    const ctx = createControlContext<string>();
    const onChange = vi.fn();
    mountAndRerender(ctx, "foo", { value: "a", onChange }, 10);

    ctx.setControlValue("foo", "b");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("b", "a", expect.anything());
  });

  it("does not reset the value on re-render (register is idempotent)", () => {
    const ctx = createControlContext<string>();
    ctx.registerControl("foo", { value: "a" });
    ctx.setControlValue("foo", "b"); // panel edit

    // Re-render with the SAME prop value: must not clobber the panel edit.
    ctx.updateControl("foo", { value: "a" });

    expect(ctx.context.registeredControls.foo.value?.get()).toBe("b");
  });

  it("syncs app -> panel silently when the prop changes (no onChange)", () => {
    const ctx = createControlContext<string>();
    const onChange = vi.fn();
    ctx.registerControl("foo", { value: "a", onChange });

    ctx.updateControl("foo", { value: "z", onChange }); // app pushed a new value

    expect(ctx.context.registeredControls.foo.value?.get()).toBe("z");
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("beforeChange gate", () => {
    it("sync cancel: returns false -> no commit, no onChange", () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("foo", {
        value: "a",
        beforeChange: () => false,
        onChange,
      });

      ctx.setControlValue("foo", "b");

      expect(ctx.context.registeredControls.foo.value?.get()).toBe("a");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("sync pass: returns nothing -> commits and fires onChange", () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("foo", {
        value: "a",
        beforeChange: () => {},
        onChange,
      });

      ctx.setControlValue("foo", "b");

      expect(ctx.context.registeredControls.foo.value?.get()).toBe("b");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("async commit: shows pending, then commits + fires onChange on resolve(true)", async () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      let release!: (ok: boolean) => void;
      const gate = new Promise<boolean>((r) => {
        release = r;
      });
      ctx.registerControl("foo", {
        value: "a",
        beforeChange: () => gate,
        onChange,
      });

      ctx.setControlValue("foo", "b");

      // While the gate is in flight: optimistic value + pending + no onChange.
      expect(ctx.context.registeredControls.foo.pending).toBe(true);
      expect(ctx.context.registeredControls.foo.value?.get()).toBe("b");
      expect(onChange).not.toHaveBeenCalled();

      release(true);
      await flush();

      expect(ctx.context.registeredControls.foo.pending).toBe(false);
      expect(ctx.context.registeredControls.foo.value?.get()).toBe("b");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("async cancel: reverts + clears pending + no onChange on resolve(false)", async () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      let release!: (ok: boolean) => void;
      const gate = new Promise<boolean>((r) => {
        release = r;
      });
      ctx.registerControl("foo", {
        value: "a",
        beforeChange: () => gate,
        onChange,
      });

      ctx.setControlValue("foo", "b");
      release(false);
      await flush();

      expect(ctx.context.registeredControls.foo.pending).toBe(false);
      expect(ctx.context.registeredControls.foo.value?.get()).toBe("a");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("type resolution", () => {
    it("resolves type by precedence: type > options > value > text", () => {
      expect(resolveControlType({ value: "hello" })).toBe("text");
      expect(resolveControlType({ value: "a", options: ["a", "b"] })).toBe(
        "select",
      );
      expect(resolveControlType({ value: true })).toBe("switch");
      expect(resolveControlType({ value: 3 })).toBe("number");
      expect(resolveControlType({ value: "#fff" })).toBe("color");
      // explicit type wins over inference
      expect(resolveControlType({ type: "text", value: "#fff" })).toBe("text");
    });

    it("resolves & stores the concrete type once at registration", () => {
      const ctx = createControlContext<string>();
      // No options/type, and a string value that does NOT start with "#".
      ctx.registerControl("reflect key", { value: "" });
      ctx.registerControl("effigy", { value: "a", options: ["a", "b"] });

      expect(ctx.context.registeredControls["reflect key"].type).toBe("text");
      expect(ctx.context.registeredControls.effigy.type).toBe("select");
    });
  });

  it("removes the control on dispose (host unmount)", () => {
    const ctx = createControlContext<string>();
    ctx.registerControl("foo", { value: "a" });
    expect(ctx.context.registeredControls.foo).toBeDefined();

    ctx.disposeControl("foo");

    expect(ctx.context.registeredControls.foo).toBeUndefined();
  });

  describe("ordering + grouping", () => {
    /** Register a group's controls, then push its options (as `useControl` does). */
    const mountGroup = (
      ctx: ReturnType<typeof createControlContext<string>>,
      groupId: string,
      // biome-ignore lint/suspicious/noExplicitAny: test config bag
      controls: Record<string, any>,
      // biome-ignore lint/suspicious/noExplicitAny: test options bag
      options?: any,
    ) => {
      for (const [key, config] of Object.entries(controls))
        ctx.registerControl(key, config, groupId);
      ctx.setGroupMeta(groupId, options);
    };

    /** Flatten ordered groups to `[key, ...]` per segment for easy assertions. */
    const keysByGroup = (
      ctx: ReturnType<typeof createControlContext<string>>,
    ) => ctx.orderedGroups().map((g) => g.entries.map(([key]) => key));

    it("defaults to registration order, both across and within groups", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", { a: { value: 1 }, b: { value: 2 } });
      mountGroup(ctx, "g2", { c: { value: 3 } });

      expect(keysByGroup(ctx)).toEqual([["a", "b"], ["c"]]);
    });

    it("sorts groups by group weight (lower first)", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", { a: { value: 1 } }, { order: 10 });
      mountGroup(ctx, "g2", { b: { value: 2 } }, { order: 0 });

      expect(keysByGroup(ctx)).toEqual([["b"], ["a"]]);
    });

    it("sorts controls within a group by per-control weight", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", {
        a: { value: 1, order: 5 },
        b: { value: 2, order: 0 },
      });

      expect(keysByGroup(ctx)).toEqual([["b", "a"]]);
    });

    it("keeps a group contiguous even when registrations interleave", () => {
      const ctx = createControlContext<string>();
      // a (g1), x (g2), b (g1) — g1's keys must still render together.
      ctx.registerControl("a", { value: 1 }, "g1");
      ctx.registerControl("x", { value: 2 }, "g2");
      ctx.registerControl("b", { value: 3 }, "g1");
      ctx.setGroupMeta("g1");
      ctx.setGroupMeta("g2");

      expect(keysByGroup(ctx)).toEqual([["a", "b"], ["x"]]);
    });

    it("surfaces collapsible metadata (label + collapsed) per group", () => {
      const ctx = createControlContext<string>();
      mountGroup(
        ctx,
        "g1",
        { a: { value: 1 } },
        { group: "Lighting", collapsed: false },
      );

      const [segment] = ctx.orderedGroups();
      expect(segment.options.group).toBe("Lighting");
      expect(segment.options.collapsed).toBe(false);
    });

    it("re-sorts live when a group's weight changes", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", { a: { value: 1 } }, { order: 0 });
      mountGroup(ctx, "g2", { b: { value: 2 } }, { order: 1 });
      expect(keysByGroup(ctx)).toEqual([["a"], ["b"]]);

      ctx.setGroupMeta("g1", { order: 5 }); // sink g1 below g2
      expect(keysByGroup(ctx)).toEqual([["b"], ["a"]]);
    });

    it("keeps group order stable if a group re-registers under the same id", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", { a: { value: 1 } });
      mountGroup(ctx, "g2", { b: { value: 2 } });

      // g1's key set changes: dispose then re-register under the same id.
      ctx.disposeControl("a");
      mountGroup(ctx, "g1", { a2: { value: 1 } });

      // g1 must stay ahead of g2 (registration order preserved), not jump to end.
      expect(keysByGroup(ctx)).toEqual([["a2"], ["b"]]);
    });

    it("drops group metadata once its last control unmounts", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "g1", { a: { value: 1 } }, { group: "Lighting" });
      ctx.disposeControl("a");

      expect(ctx.orderedGroups()).toEqual([]);
    });

    it("merges controls from different instances that share a named group", () => {
      const ctx = createControlContext<string>();
      mountGroup(
        ctx,
        "inst-a",
        { theme: { value: "system" } },
        { group: "theme" },
      );
      mountGroup(
        ctx,
        "inst-b",
        { "ray color": { type: "color", value: "ffa85c" } },
        { group: "theme" },
      );

      const groups = ctx.orderedGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0].options.group).toBe("theme");
      expect(groups[0].entries.map(([key]) => key)).toEqual([
        "theme",
        "ray color",
      ]);
    });

    it("orders controls across instances within a shared group by weight", () => {
      const ctx = createControlContext<string>();
      mountGroup(
        ctx,
        "inst-a",
        { theme: { value: "x", order: 5 } },
        { group: "theme" },
      );
      mountGroup(
        ctx,
        "inst-b",
        { rays: { value: "y", order: 0 } },
        { group: "theme" },
      );

      expect(ctx.orderedGroups()[0].entries.map(([key]) => key)).toEqual([
        "rays",
        "theme",
      ]);
    });

    it("keeps a shared named group alive until every instance unmounts", () => {
      const ctx = createControlContext<string>();
      mountGroup(
        ctx,
        "inst-a",
        { theme: { value: "system" } },
        { group: "theme" },
      );
      mountGroup(
        ctx,
        "inst-b",
        { "ray color": { type: "color", value: "ffa85c" } },
        { group: "theme" },
      );

      ctx.disposeControl("theme"); // inst-a unmounts

      const groups = ctx.orderedGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0].options.group).toBe("theme");
      expect(groups[0].entries.map(([key]) => key)).toEqual(["ray color"]);
    });

    it("does not merge anonymous groups (group: true stays per-instance)", () => {
      const ctx = createControlContext<string>();
      mountGroup(ctx, "inst-a", { a: { value: 1 } }, { group: true });
      mountGroup(ctx, "inst-b", { b: { value: 2 } }, { group: true });

      const groups = ctx.orderedGroups();
      expect(groups).toHaveLength(2);
      expect(groups.map((g) => g.entries.map(([key]) => key))).toEqual([
        ["a"],
        ["b"],
      ]);
    });
  });

  describe("persistence (persist: true)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("saves type + value under control:<key> on a committed panel edit", () => {
      const store = stubStorage();
      const ctx = createControlContext<string>();
      ctx.registerControl("foo", { value: "a", persist: true });

      ctx.setControlValue("foo", "b");

      expect(JSON.parse(store.get("control:foo") ?? "null")).toEqual({
        type: "text",
        value: "b",
      });
    });

    it("does not touch localStorage without persist: true", () => {
      const store = stubStorage();
      const ctx = createControlContext<string>();
      ctx.registerControl("foo", { value: "a" });

      ctx.setControlValue("foo", "b");

      expect(store.size).toBe(0);
    });

    it("saves when the app pushes a new prop value (silent sync)", () => {
      const store = stubStorage();
      const ctx = createControlContext<string>();
      ctx.registerControl("foo", { value: "a", persist: true });

      ctx.updateControl("foo", { value: "z", persist: true });

      expect(JSON.parse(store.get("control:foo") ?? "null")).toEqual({
        type: "text",
        value: "z",
      });
    });

    it("restores a saved value at registration and fires onChange(restored, default)", () => {
      stubStorage({
        "control:foo": JSON.stringify({ type: "switch", value: false }),
      });
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("foo", { value: true, persist: true, onChange });

      expect(ctx.context.registeredControls.foo.value?.get()).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false, true, expect.anything());
    });

    it("does not fire onChange when the saved value equals the default", () => {
      stubStorage({
        "control:foo": JSON.stringify({ type: "switch", value: true }),
      });
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("foo", { value: true, persist: true, onChange });

      expect(ctx.context.registeredControls.foo.value?.get()).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("ignores saved values entirely without persist: true", () => {
      stubStorage({
        "control:foo": JSON.stringify({ type: "switch", value: false }),
      });
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("foo", { value: true, onChange });

      expect(ctx.context.registeredControls.foo.value?.get()).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("warns and discards a saved value whose type doesn't match the control", () => {
      const store = stubStorage({
        "control:foo": JSON.stringify({ type: "text", value: "hi" }),
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const ctx = createControlContext<string>();
        const onChange = vi.fn();
        ctx.registerControl("foo", { value: true, persist: true, onChange });

        expect(ctx.context.registeredControls.foo.value?.get()).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(store.has("control:foo")).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    it("warns and discards a saved value whose runtime type is tampered", () => {
      const store = stubStorage({
        // type claims switch, but the value is a string
        "control:foo": JSON.stringify({ type: "switch", value: "true" }),
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const ctx = createControlContext<string>();
        ctx.registerControl("foo", { value: true, persist: true });

        expect(ctx.context.registeredControls.foo.value?.get()).toBe(true);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(store.has("control:foo")).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    it("warns and discards unparseable garbage", () => {
      const store = stubStorage({ "control:foo": "not json{" });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const ctx = createControlContext<string>();
        ctx.registerControl("foo", { value: true, persist: true });

        expect(ctx.context.registeredControls.foo.value?.get()).toBe(true);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(store.has("control:foo")).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    it("is a no-op when localStorage is unavailable", () => {
      // No stub: node has no localStorage. Nothing should throw.
      const ctx = createControlContext<string>();
      ctx.registerControl("foo", { value: "a", persist: true });
      ctx.setControlValue("foo", "b");

      expect(ctx.context.registeredControls.foo.value?.get()).toBe("b");
    });
  });

  describe("stale async guard resolutions (F1)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("does not revert a newer host value when a stale async guard cancels", async () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      let release!: (ok: boolean) => void;
      const gate = new Promise<boolean>((r) => {
        release = r;
      });
      const config = { value: "a", beforeChange: () => gate, onChange };
      ctx.registerControl("foo", config);

      ctx.setControlValue("foo", "b"); // panel edit, guard in flight
      ctx.updateControl("foo", { ...config, value: "z" }); // host pushes z mid-flight

      release(false);
      await flush();

      expect(ctx.context.registeredControls.foo.value?.get()).toBe("z");
      expect(ctx.context.registeredControls.foo.pending).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not commit, persist, or fire onChange for a superseded async guard", async () => {
      const store = stubStorage();
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      let release!: (ok: boolean) => void;
      const gate = new Promise<boolean>((r) => {
        release = r;
      });
      const config = {
        value: "a",
        persist: true,
        beforeChange: () => gate,
        onChange,
      };
      ctx.registerControl("foo", config);

      ctx.setControlValue("foo", "b");
      ctx.updateControl("foo", { ...config, value: "z" });

      release(true);
      await flush();

      expect(ctx.context.registeredControls.foo.value?.get()).toBe("z");
      expect(ctx.context.registeredControls.foo.pending).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(JSON.parse(store.get("control:foo") ?? "null")).toEqual({
        type: "text",
        value: "z",
      });
    });
  });

  describe("key-set fingerprint (F2)", () => {
    it("is order-insensitive (a reorder is not a key-set change)", () => {
      expect(keySetFingerprint(["a", "b"])).toBe(keySetFingerprint(["b", "a"]));
    });

    it("differs when the set actually changes", () => {
      expect(keySetFingerprint(["a", "b"])).not.toBe(
        keySetFingerprint(["a", "b", "c"]),
      );
    });

    it("distinguishes sets a joined string would conflate", () => {
      expect(keySetFingerprint(["a::b", "c"])).not.toBe(
        keySetFingerprint(["a", "b::c"]),
      );
    });
  });

  describe("action controls (F3)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("ignores persist for action controls (no reads, no writes, no warn)", () => {
      const store = stubStorage({
        "control:fire": JSON.stringify({ type: "action", value: "123" }),
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const ctx = createControlContext<string>();
        const onChange = vi.fn();
        ctx.registerControl("fire", {
          type: "action",
          value: null,
          persist: true,
          onChange,
        });

        expect(ctx.context.registeredControls.fire.value?.get()).toBe(null);
        expect(onChange).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();

        ctx.setControlValue("fire", "456"); // a trigger commits a timestamp string

        expect(store.get("control:fire")).toBe(
          JSON.stringify({ type: "action", value: "123" }),
        );
        expect(onChange).toHaveBeenCalledWith("456", null, expect.anything());
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe("numeric select options (F4)", () => {
    it("commits the original numeric option when the panel emits its string form", () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("num", { value: 1, options: [1, 2], onChange });

      ctx.setControlValue("num", "2");

      expect(ctx.context.registeredControls.num.value?.get()).toBe(2);
      expect(onChange).toHaveBeenCalledWith(2, 1, expect.anything());
    });

    it("leaves string option values untouched", () => {
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("theme", {
        value: "light",
        options: ["light", "dark"],
        onChange,
      });

      ctx.setControlValue("theme", "dark");

      expect(ctx.context.registeredControls.theme.value?.get()).toBe("dark");
      expect(onChange).toHaveBeenCalledWith("dark", "light", expect.anything());
    });
  });

  describe("color value normalization (F5)", () => {
    it("strips the leading # when inferring a color control", () => {
      const ctx = createControlContext<string>();
      ctx.registerControl("accent", { value: "#fff" });

      expect(ctx.context.registeredControls.accent.type).toBe("color");
      expect(ctx.context.registeredControls.accent.value?.get()).toBe("fff");
    });

    it("strips the leading # from host prop pushes to a color control", () => {
      const ctx = createControlContext<string>();
      ctx.registerControl("accent", { value: "#fff" });

      ctx.updateControl("accent", { value: "#abc123" });

      expect(ctx.context.registeredControls.accent.value?.get()).toBe("abc123");
    });
  });

  describe("actionProps reconciliation (F6)", () => {
    it("clears action components when actionProps is removed on re-render", () => {
      const ctx = createControlContext<string>();
      ctx.registerControl("fire", {
        type: "action",
        value: null,
        actionProps: { children: "Reset" },
      });
      expect(ctx.getActionComponents("fire")?.children).toBe("Reset");

      ctx.updateControl("fire", { type: "action", value: null });

      expect(ctx.getActionComponents("fire")).toBeUndefined();
    });

    it("does not leak action components across dispose/re-register", () => {
      const ctx = createControlContext<string>();
      ctx.registerControl("fire", {
        type: "action",
        value: null,
        actionProps: { children: "Reset" },
      });
      ctx.disposeControl("fire");
      ctx.registerControl("fire", { type: "action", value: null });

      expect(ctx.getActionComponents("fire")).toBeUndefined();
    });

    it("updates button props for an inferred action (no explicit type)", () => {
      const ctx = createControlContext<string>();
      // value: null infers "action" — the input's `type` stays undefined.
      ctx.registerControl("fire", {
        value: null,
        actionProps: { variant: "outline" },
      });

      ctx.updateControl("fire", {
        value: null,
        actionProps: { variant: "ghost" },
      });

      expect(ctx.context.registeredControls.fire.actionProps?.variant).toBe(
        "ghost",
      );
    });
  });

  describe("persisted select membership (F7)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("warns and discards a persisted select value no longer in the option set", () => {
      const store = stubStorage({
        "control:theme": JSON.stringify({ type: "select", value: "sepia" }),
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const ctx = createControlContext<string>();
        const onChange = vi.fn();
        ctx.registerControl("theme", {
          value: "system",
          options: ["system", "light", "dark"],
          persist: true,
          onChange,
        });

        expect(ctx.context.registeredControls.theme.value?.get()).toBe(
          "system",
        );
        expect(onChange).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(store.has("control:theme")).toBe(false);
      } finally {
        warn.mockRestore();
      }
    });

    it("restores a persisted select value still in the option set", () => {
      stubStorage({
        "control:theme": JSON.stringify({ type: "select", value: "dark" }),
      });
      const ctx = createControlContext<string>();
      const onChange = vi.fn();
      ctx.registerControl("theme", {
        value: "system",
        options: ["system", "light", "dark"],
        persist: true,
        onChange,
      });

      expect(ctx.context.registeredControls.theme.value?.get()).toBe("dark");
      expect(onChange).toHaveBeenCalledWith(
        "dark",
        "system",
        expect.anything(),
      );
    });
  });

  it("logs changes only when log is enabled", () => {
    const ctx = createControlContext<string>();
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    try {
      ctx.registerControl("loud", { value: "a", log: true });
      ctx.registerControl("quiet", { value: "a" });

      ctx.setControlValue("loud", "b");
      ctx.setControlValue("quiet", "b");

      // Logging now routes through the styled `l` tag, so the message + key are
      // baked into a `%c` format string we can't match literally. But it still
      // lands on console.debug, and the change payload rides along as the final,
      // un-styled argument — assert the gate via those stable signals.
      expect(debug).toHaveBeenCalledTimes(1); // only the `log: true` control
      expect(debug.mock.calls[0].at(-1)).toEqual({ prev: "a", value: "b" });
      // ...and it's the commit log specifically (the format carries the message)
      expect(debug.mock.calls[0][0]).toContain("committed");
    } finally {
      debug.mockRestore();
    }
  });
});
