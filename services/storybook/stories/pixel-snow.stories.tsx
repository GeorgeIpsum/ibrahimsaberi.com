import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PixelSnow from "@/components/shaders/pixel-snow";

const meta = {
  title: "Shaders/PixelSnow",
  component: PixelSnow,
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
          "Raymarched, depth-faded snowfall rendered as pixel-snapped flakes drifting in a wind direction.",
      },
    },
  },
  args: {
    color: "#ffffff",
    flakeSize: 0.01,
    minFlakeSize: 1.25,
    pixelResolution: 200,
    speed: 1.25,
    depthFade: 8,
    farPlane: 20,
    brightness: 1,
    gamma: 0.4545,
    density: 0.3,
    variant: "square",
    direction: 125,
  },
  argTypes: {
    color: { control: "color" },
    flakeSize: { control: { type: "number", min: 0, step: 0.001 } },
    minFlakeSize: { control: { type: "number", min: 0, step: 0.05 } },
    pixelResolution: { control: { type: "number", min: 10, step: 10 } },
    speed: { control: { type: "number", step: 0.05 } },
    depthFade: { control: { type: "number", min: 0, step: 0.5 } },
    farPlane: { control: { type: "number", min: 1, step: 1 } },
    brightness: { control: { type: "number", min: 0, step: 0.05 } },
    gamma: { control: { type: "number", min: 0, step: 0.01 } },
    density: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    variant: {
      control: "select",
      options: ["square", "round", "snowflake"],
    },
    direction: { control: { type: "number", min: 0, max: 360, step: 1 } },
  },
} satisfies Meta<typeof PixelSnow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// The "snowflake" variant: flakes are traced as tiny six-armed crystals
// instead of squares, at a larger size so the shape reads clearly.
export const Snowflake: Story = {
  args: {
    variant: "snowflake",
    flakeSize: 0.025,
    minFlakeSize: 2,
    density: 0.15,
  },
};
