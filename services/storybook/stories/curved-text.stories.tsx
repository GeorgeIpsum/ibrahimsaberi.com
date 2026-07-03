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
  parameters: { layout: "centered" },
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
