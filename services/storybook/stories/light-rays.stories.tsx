import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LightRays } from "@/components/backgrounds/light-rays";

const meta = {
  title: "Backgrounds/LightRays",
  component: LightRays,
  decorators: [
    // Luminous/lighten-blend effect — invisible on a light backdrop, so the demo container is fixed dark.
    (Story) => (
      <div className="relative h-[480px] w-[720px] overflow-hidden rounded-lg border bg-black">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Animated CSS light rays that sweep and fade across the container over two soft radial glows.",
      },
    },
  },
  args: {
    count: 7,
    color: "rgba(160, 210, 255, 0.2)",
    blur: 36,
    speed: 14,
    length: "70vh",
  },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 30, step: 1 } },
    color: { control: "color" },
    blur: { control: { type: "number", min: 0 } },
    speed: { control: { type: "number", min: 0.1 } },
    length: { control: "text" },
  },
} satisfies Meta<typeof LightRays>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
