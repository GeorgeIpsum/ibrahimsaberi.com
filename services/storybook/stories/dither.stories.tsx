import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Dither from "@/components/shaders/dither";

const meta = {
  title: "Shaders/Dither",
  component: Dither,
  // WebGL (three.js + postprocessing) — the vitest browser addon has no reliable GPU
  // context in headless Chromium, so this story is excluded from the render-smoke-test sweep.
  tags: ["!test"],
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
          "Animated fbm noise waves post-processed through a Bayer-matrix dither pass, with optional mouse-radius disturbance.",
      },
    },
  },
  args: {
    waveSpeed: 0.05,
    waveFrequency: 3,
    waveAmplitude: 0.3,
    waveColor: [0.5, 0.5, 0.5],
    colorNum: 4,
    pixelSize: 2,
    disableAnimation: false,
    enableMouseInteraction: true,
    mouseRadius: 1,
  },
  argTypes: {
    waveSpeed: { control: { type: "number", step: 0.01 } },
    waveFrequency: { control: { type: "number", step: 0.1 } },
    waveAmplitude: { control: { type: "number", step: 0.05 } },
    waveColor: { control: "object" },
    colorNum: { control: { type: "number", min: 2, step: 1 } },
    pixelSize: { control: { type: "number", min: 1, step: 1 } },
    disableAnimation: { control: "boolean" },
    enableMouseInteraction: { control: "boolean" },
    mouseRadius: { control: { type: "number", min: 0, step: 0.1 } },
  },
} satisfies Meta<typeof Dither>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Animation frozen and quantized to two colors: a static, high-contrast
// dither pattern with no wave motion or mouse disturbance.
export const Frozen: Story = {
  args: {
    disableAnimation: true,
    enableMouseInteraction: false,
    colorNum: 2,
    pixelSize: 4,
  },
};
