import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NoiseTexture } from "@/components/backgrounds/noise";

const meta = {
  title: "Backgrounds/Noise",
  component: NoiseTexture,
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
          "A full-bleed SVG feTurbulence grain texture layered over the background.",
      },
    },
  },
  args: {
    frequency: 0.4,
    octaves: 6,
    slope: 0.15,
    noiseOpacity: 0.6,
  },
  argTypes: {
    frequency: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    octaves: { control: { type: "number", min: 1, max: 10, step: 1 } },
    slope: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    noiseOpacity: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
  },
} satisfies Meta<typeof NoiseTexture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
