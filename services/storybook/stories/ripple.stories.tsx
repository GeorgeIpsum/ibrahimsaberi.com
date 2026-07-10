import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ripple } from "@/components/backgrounds/ripple";

const meta = {
  title: "Backgrounds/Ripple",
  component: Ripple,
  decorators: [
    (Story) => (
      <div className="relative h-[480px] w-[720px] overflow-hidden rounded-lg border bg-background">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Concentric circles that pulse outward from center, masked to fade toward the bottom edge.",
      },
    },
  },
  args: {
    mainCircleSize: 210,
    mainCircleOpacity: 0.24,
    numCircles: 8,
  },
  argTypes: {
    mainCircleSize: { control: { type: "number", min: 0 } },
    mainCircleOpacity: {
      control: { type: "number", min: 0, max: 1, step: 0.01 },
    },
    numCircles: { control: { type: "number", min: 1, max: 20, step: 1 } },
  },
} satisfies Meta<typeof Ripple>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
