import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MagicRings from "@/components/backgrounds/magic-rings";

const meta = {
  title: "Backgrounds/MagicRings",
  component: MagicRings,
  // WebGL (three.js) — the vitest browser addon has no reliable GPU context in headless Chromium,
  // so this story is excluded from the render-smoke-test sweep entirely.
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
          "A WebGL shader of concentric, color-shifting rings that can react to the cursor and clicks.",
      },
    },
  },
  args: {
    color: "#fc42ff",
    colorTwo: "#42fcff",
    speed: 1,
    ringCount: 6,
    attenuation: 10,
    lineThickness: 2,
    baseRadius: 0.35,
    radiusStep: 0.1,
    scaleRate: 0.1,
    opacity: 1,
    blur: 0,
    noiseAmount: 0.1,
    rotation: 0,
    ringGap: 1.5,
    fadeIn: 0.7,
    fadeOut: 0.5,
    followMouse: false,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    parallax: 0.05,
    clickBurst: false,
  },
  argTypes: {
    color: { control: "color" },
    colorTwo: { control: "color" },
    speed: { control: { type: "number", min: 0, step: 0.1 } },
    ringCount: { control: { type: "number", min: 1, max: 10, step: 1 } },
    attenuation: { control: { type: "number", min: 0, step: 0.5 } },
    lineThickness: { control: { type: "number", min: 0, step: 0.5 } },
    baseRadius: { control: { type: "number", min: 0, step: 0.01 } },
    radiusStep: { control: { type: "number", step: 0.01 } },
    scaleRate: { control: { type: "number", step: 0.01 } },
    opacity: { control: { type: "number", min: 0, max: 1, step: 0.05 } },
    blur: { control: { type: "number", min: 0 } },
    noiseAmount: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    rotation: { control: { type: "number", min: 0, max: 360, step: 1 } },
    ringGap: { control: { type: "number", min: 0, step: 0.1 } },
    fadeIn: { control: { type: "number", min: 0, step: 0.05 } },
    fadeOut: { control: { type: "number", min: 0, step: 0.05 } },
    followMouse: { control: "boolean" },
    mouseInfluence: { control: { type: "number", step: 0.05 } },
    hoverScale: { control: { type: "number", step: 0.05 } },
    parallax: { control: { type: "number", step: 0.01 } },
    clickBurst: { control: "boolean" },
  },
} satisfies Meta<typeof MagicRings>;

export default meta;
type Story = StoryObj<typeof meta>;

// The reactbits.dev demo defaults — the most visually representative
// combination of the shader's parameters.
export const Playground: Story = {};

// Slow, quiet, static rings: reduced ring count, low attenuation falloff,
// almost no noise, no mouse reactivity.
export const Calm: Story = {
  args: {
    ringCount: 3,
    speed: 0.3,
    attenuation: 14,
    lineThickness: 1,
    noiseAmount: 0.02,
    rotation: 0,
    followMouse: false,
    hoverScale: 1,
    parallax: 0,
    clickBurst: false,
    opacity: 0.6,
    color: "#8ec5ff",
    colorTwo: "#c9b6ff",
  },
};

// Fast, dense, and fully reactive: max ring count, high speed and noise,
// mouse-follow + parallax + click bursts all engaged.
export const Chaotic: Story = {
  args: {
    ringCount: 10,
    speed: 4,
    attenuation: 4,
    lineThickness: 4,
    noiseAmount: 0.6,
    rotation: 45,
    followMouse: true,
    mouseInfluence: 0.6,
    hoverScale: 1.8,
    parallax: 0.25,
    clickBurst: true,
    opacity: 1,
    color: "#fc42ff",
    colorTwo: "#faff42",
  },
};
