import { describe, expect, it, vi } from "vitest";
import {
  createControlContext,
  resolveControlType,
} from "@/features/control-panel/control-context";

/** Let queued microtasks/promises settle (for async `beforeChange`). */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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
