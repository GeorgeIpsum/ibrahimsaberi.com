import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { controlContext } from "@/features/control-panel/control-context";
import { useControl } from "@/features/control-panel/use-control";

/**
 * Lifecycle tests for the `useControl` hook against the real module singleton
 * (`controlContext`). RTL's auto-cleanup unmounts after each test, which
 * disposes that test's controls — keys are still namespaced per test so a
 * failure can't bleed into its neighbors.
 */

// biome-ignore lint/suspicious/noExplicitAny: test config bag
type Props = { controls: Record<string, any>; options?: any };

const mount = (initialProps: Props) =>
  renderHook(({ controls, options }: Props) => useControl(controls, options), {
    initialProps,
  });

const value = (key: string) =>
  controlContext.context.registeredControls[key]?.value?.get();

describe("useControl lifecycle", () => {
  it("registers controls on mount and disposes them on unmount", () => {
    const { unmount } = mount({ controls: { "lc:a": { value: 1 } } });

    expect(value("lc:a")).toBe(1);

    unmount();

    expect(controlContext.context.registeredControls["lc:a"]).toBeUndefined();
  });

  it("keeps live panel edits across a pure key reorder", () => {
    const { rerender } = mount({
      controls: { "ro:a": { value: 1 }, "ro:b": { value: 2 } },
    });

    controlContext.setControlValue("ro:a", 5); // panel edit

    // Same key SET, different insertion order: must NOT dispose/re-register.
    rerender({ controls: { "ro:b": { value: 2 }, "ro:a": { value: 1 } } });

    expect(value("ro:a")).toBe(5);
    expect(value("ro:b")).toBe(2);
  });

  it("re-registers when the key set genuinely changes", () => {
    const { rerender } = mount({
      controls: { "ks:a": { value: 1 }, "ks:b": { value: 2 } },
    });

    rerender({ controls: { "ks:a": { value: 1 }, "ks:c": { value: 3 } } });

    expect(controlContext.context.registeredControls["ks:b"]).toBeUndefined();
    expect(value("ks:a")).toBe(1);
    expect(value("ks:c")).toBe(3);
  });

  it("pushes prop changes to the store silently on re-render", () => {
    const onChange = vi.fn();
    const { rerender } = mount({
      controls: { "pp:a": { value: "x", onChange } },
    });

    rerender({ controls: { "pp:a": { value: "y", onChange } } });

    expect(value("pp:a")).toBe("y");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses the latest onChange handler, not the one captured at mount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = mount({
      controls: { "lh:a": { value: "x", onChange: first } },
    });

    rerender({ controls: { "lh:a": { value: "x", onChange: second } } });
    controlContext.setControlValue("lh:a", "z");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("z", "x", expect.anything());
  });

  it("applies group options and keeps all of an instance's keys in one group", () => {
    mount({
      controls: { "gr:a": { value: 1 }, "gr:b": { value: 2 } },
      options: { group: "demo group" },
    });

    const segment = controlContext
      .orderedGroups()
      .find((g) => g.options.group === "demo group");
    expect(segment).toBeDefined();
    expect(segment?.entries.map(([key]) => key)).toEqual(["gr:a", "gr:b"]);
  });
});
