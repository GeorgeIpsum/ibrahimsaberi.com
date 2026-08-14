import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useReducer } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  type ControlGroupOptions,
  type ControlInput,
  type ControlType,
  controlContext,
} from "@/features/control-panel/control-context";
import { ControlGroup } from "@/features/control-panel/control-group";
import { ControlPanel } from "@/features/control-panel/control-panel";
import { ControlRow } from "@/features/control-panel/control-row";
import { useControl } from "@/features/control-panel/use-control";

type ControlConfig = Record<string, ControlInput<ControlType>>;

/** Register a config without rendering anything (for full-panel stories). */
function Registrar({
  config,
  options,
}: {
  config: ControlConfig;
  options?: ControlGroupOptions;
}) {
  useControl(config, options);
  return null;
}

/**
 * Mounts a `useControl` config and renders its panel rows — what `PanelBody`
 * does, minus the fixed-position chrome. Registration happens in a layout
 * effect, so the host forces one re-render after mount to pick up the
 * registered rows; each row is itself a MobX observer, so everything after
 * that (values, pending, disabled) is live.
 */
function Host({
  config,
  options,
}: {
  config: ControlConfig;
  options?: ControlGroupOptions;
}) {
  useControl(config, options);
  const [mounted, force] = useReducer(() => true, false);
  useEffect(force, []);
  if (!mounted) return null;
  return (
    <div className="flex w-80 flex-col gap-y-1.5 font-mono">
      {controlContext
        .orderedGroups()
        .map(({ id, options: groupOptions, entries }) =>
          groupOptions.group ? (
            <ControlGroup
              key={id}
              label={
                typeof groupOptions.group === "string"
                  ? groupOptions.group
                  : "group"
              }
              defaultCollapsed={groupOptions.collapsed ?? true}
              entries={entries}
            />
          ) : (
            entries.map(([key, control]) => (
              <ControlRow key={key} controlKey={key} control={control} />
            ))
          ),
        )}
    </div>
  );
}

// The control store is a module singleton, so every story uses its own
// namespaced keys; hosts dispose their controls on unmount between stories.
const meta = {
  title: "Features/Control Panel",
  component: Host,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Interaction coverage for the control-panel field renderers (`useControl` → store → row components).",
      },
    },
  },
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

const spyOf = (config: ControlConfig, key: string) =>
  config[key].onChange as ReturnType<typeof fn>;

export const NumericSelect: Story = {
  args: {
    config: { "num count": { value: 1, options: [1, 2, 3], onChange: fn() } },
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(
      await within(document.body).findByRole("option", { name: "2" }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("combobox")).toHaveTextContent("2"),
    );
    // The NUMBER 2, not "2" — numeric options keep their runtime type.
    expect(spyOf(args.config, "num count")).toHaveBeenLastCalledWith(
      2,
      1,
      expect.anything(),
    );
  },
};

export const InferredColor: Story = {
  args: { config: { "col accent": { value: "#ffa85c", onChange: fn() } } },
  play: async ({ canvas, canvasElement, args }) => {
    // "#ffa85c" infers a color control; the "#" is stripped at registration.
    await expect(canvas.getByLabelText("Color input hex")).toHaveValue(
      "ffa85c",
    );
    const swatch = canvasElement.querySelector<HTMLElement>(
      "button[class*='color-control-panel'] > div",
    );
    expect(swatch).not.toBeNull();
    await waitFor(() =>
      expect(getComputedStyle(swatch as HTMLElement).backgroundColor).toBe(
        "rgb(255, 168, 92)",
      ),
    );

    // Drive the picker: open the popover, nudge the hue with the keyboard.
    await userEvent.click((swatch as HTMLElement).closest("button") as Element);
    const hue = await within(document.body).findByRole("slider", {
      name: "Hue",
    });
    hue.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => {
      const spy = spyOf(args.config, "col accent");
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls.at(-1)?.[0]).toMatch(/^[0-9a-f]{6}$/);
    });
  },
};

export const SwitchToggle: Story = {
  args: { config: { "sw glow": { value: false, onChange: fn() } } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("switch"));
    await waitFor(() =>
      expect(spyOf(args.config, "sw glow")).toHaveBeenLastCalledWith(
        true,
        false,
        expect.anything(),
      ),
    );
  },
};

export const AsyncActionPending: Story = {
  args: {
    config: {
      "act save": {
        type: "action",
        value: null,
        beforeChange: () =>
          new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(true), 300),
          ),
        onChange: fn(),
        actionProps: { children: "Save" },
      },
    },
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    // The async gate is in flight: the store marks the control pending.
    expect(controlContext.context.registeredControls["act save"].pending).toBe(
      true,
    );

    await waitFor(
      () => {
        const spy = spyOf(args.config, "act save");
        expect(
          controlContext.context.registeredControls["act save"].pending,
        ).toBe(false);
        // Actions commit a "last triggered" timestamp string.
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls.at(-1)?.[0]).toEqual(expect.any(String));
      },
      { timeout: 2000 },
    );
  },
};

export const CollapsibleGroup: Story = {
  args: {
    config: { "grp speed": { value: "warp" } },
    options: { group: "demo group", collapsed: false },
  },
  decorators: [
    (Story) => {
      // Collapse state persists by label; reset so re-runs start open.
      try {
        window.localStorage.removeItem("controlGroup:demo group");
      } catch {
        /* no-op */
      }
      return <Story />;
    },
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByText("grp speed")).toBeVisible();

    await userEvent.click(canvas.getByText("demo group"));

    await waitFor(() =>
      expect(window.localStorage.getItem("controlGroup:demo group")).toBe(
        "collapsed",
      ),
    );
  },
};

export const PanelShell: Story = {
  args: {
    config: { "shell theme": { value: "dark", options: ["light", "dark"] } },
  },
  decorators: [
    (Story) => {
      // The panel reads its visibility from localStorage on mount.
      try {
        window.localStorage.panelVisible = "true";
      } catch {
        /* no-op */
      }
      return <Story />;
    },
  ],
  render: (args) => (
    <>
      <Registrar config={args.config} />
      <ControlPanel />
    </>
  ),
  play: async () => {
    const screen = within(document.body);
    await expect(await screen.findByText("control panel")).toBeVisible();
    await expect(screen.getByText("shell theme")).toBeVisible();

    // ctrl+k hides the panel (AnimatePresence exit, then unmount).
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(screen.queryByText("control panel")).toBeNull());
  },
};
