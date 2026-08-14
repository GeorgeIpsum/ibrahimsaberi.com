import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  CurvedText,
  type CurvedTextPhase,
  type CurvedTextProps,
} from "@/components/text/curved-text";

const phases: CurvedTextPhase[] = ["flat", "cylinder", "ring"];

const meta = {
  title: "Text/CurvedText",
  component: CurvedText,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Text that morphs between a flat line, a wrapped cylinder, and a spinning ring.",
      },
    },
  },
  args: {
    text: "the quick brown fox ",
    phase: "flat",
    size: 240,
    spinDuration: 20,
    morphDuration: 1.2,
    sizeTransition: { stagger: false, staggerDuration: 0.05, delay: 0 },
    onHover: "speedUp",
    className: "font-black text-2xl",
  },
  argTypes: {
    phase: { control: "radio", options: phases },
    size: { control: "number" },
    spinDuration: { control: "number" },
    morphDuration: { control: "number" },
    sizeTransition: { control: "object" },
    onHover: {
      control: "select",
      options: ["slowDown", "speedUp", "pause", "goBonkers"],
    },
  },
} satisfies Meta<typeof CurvedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const PhaseStepper = (args: CurvedTextProps) => {
  const [phase, setPhase] = useState<CurvedTextPhase>(args.phase);
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex gap-2">
        {phases.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhase(p)}
            className={`rounded border px-3 py-1 text-sm ${
              phase === p ? "border-current font-bold" : "opacity-60"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <CurvedText {...args} phase={phase} />
    </div>
  );
};

export const Stepper: Story = {
  render: (args) => <PhaseStepper {...args} />,
};

// All three phases rendered side by side at rest — a static complement to
// the interactive Stepper above.
export const Phases: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-10">
      {phases.map((phase) => (
        <div key={phase} className="flex flex-col items-center gap-3">
          <CurvedText {...args} phase={phase} size={140} />
          <span className="text-muted-foreground text-xs">{phase}</span>
        </div>
      ))}
    </div>
  ),
};
