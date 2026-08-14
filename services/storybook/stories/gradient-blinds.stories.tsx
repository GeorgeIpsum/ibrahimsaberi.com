import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import GradientBlinds from "@/components/shaders/gradient-blinds";

const meta = {
  title: "Shaders/GradientBlinds",
  component: GradientBlinds,
  // WebGL (ogl) — the vitest browser addon has no reliable GPU context in headless Chromium,
  // so this story is excluded from the render-smoke-test sweep entirely.
  tags: ["!test"],
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
          "Rotatable window-blind stripes painted with a multi-stop gradient, noised and lit by a cursor-following spotlight.",
      },
    },
  },
  args: {
    gradientColors: ["#FF9FFC", "#5227FF"],
    angle: 0,
    noise: 0.3,
    blindCount: 16,
    blindMinWidth: 60,
    mouseDampening: 0.15,
    mirrorGradient: false,
    spotlightRadius: 0.5,
    spotlightSoftness: 1,
    spotlightOpacity: 1,
    distortAmount: 0,
    shineDirection: "left",
    mixBlendMode: "lighten",
    paused: false,
  },
  argTypes: {
    gradientColors: { control: "object" },
    angle: { control: { type: "number", min: 0, max: 360, step: 1 } },
    noise: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    blindCount: { control: { type: "number", min: 1, step: 1 } },
    blindMinWidth: { control: { type: "number", min: 1, step: 5 } },
    mouseDampening: { control: { type: "number", min: 0, step: 0.01 } },
    mirrorGradient: { control: "boolean" },
    spotlightRadius: { control: { type: "number", min: 0, step: 0.01 } },
    spotlightSoftness: { control: { type: "number", min: 0, step: 0.1 } },
    spotlightOpacity: {
      control: { type: "number", min: 0, max: 1, step: 0.01 },
    },
    distortAmount: { control: { type: "number", min: 0, step: 0.1 } },
    shineDirection: { control: "radio", options: ["left", "right"] },
    mixBlendMode: {
      control: "select",
      options: [
        "normal",
        "multiply",
        "screen",
        "overlay",
        "darken",
        "lighten",
        "difference",
        "exclusion",
        "color-dodge",
        "color-burn",
        "hard-light",
        "soft-light",
      ],
    },
    dpr: { control: { type: "number", min: 0.5, step: 0.5 } },
    paused: { control: "boolean" },
    className: { control: "text" },
  },
} satisfies Meta<typeof GradientBlinds>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Frozen on a single frame: no time-driven noise flicker, useful for
// inspecting the blind geometry and gradient mapping in isolation.
export const Paused: Story = {
  args: {
    paused: true,
  },
};
