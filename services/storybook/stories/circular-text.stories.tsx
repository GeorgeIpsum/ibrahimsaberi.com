import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircularText } from "@/components/text/circular-text";

const hoverModes = ["slowDown", "speedUp", "pause", "goBonkers"] as const;

const meta = {
  title: "Text/CircularText",
  component: CircularText,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Text arranged on a spinning ring whose rotation speed reacts to hover.",
      },
    },
  },
  args: {
    text: "CIRCULAR TEXT * SPINS AROUND * ",
    size: 200,
    spinDuration: 20,
    onHover: "speedUp",
    className: "bg-black",
    textClassName: "",
  },
  argTypes: {
    size: { control: "number" },
    spinDuration: { control: "number" },
    onHover: { control: "select", options: hoverModes },
  },
} satisfies Meta<typeof CircularText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// All four `onHover` behaviors rendered side by side — hover each ring to
// compare how it reacts (spin speed change, pause, or scale down).
export const HoverModes: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-10">
      {hoverModes.map((mode) => (
        <div key={mode} className="flex flex-col items-center gap-2">
          <CircularText {...args} size={140} onHover={mode} />
          <span className="text-muted-foreground text-xs">{mode}</span>
        </div>
      ))}
    </div>
  ),
};
