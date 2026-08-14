import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PrismaticBurst from "@/components/shaders/prismatic-burst";

const meta = {
  title: "Shaders/PrismaticBurst",
  component: PrismaticBurst,
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
          "Raymarched rays bursting from a point, tinted by a color gradient and animated by rotation, 3D tumble, or hover.",
      },
    },
  },
  args: {
    intensity: 2,
    speed: 0.5,
    animationType: "rotate3d",
    distort: 0,
    paused: false,
    offset: { x: 0, y: 0 },
    hoverDampness: 0,
    mixBlendMode: "lighten",
  },
  argTypes: {
    intensity: { control: { type: "number", min: 0, step: 0.1 } },
    speed: { control: { type: "number", step: 0.1 } },
    animationType: {
      control: "select",
      options: ["rotate", "rotate3d", "hover"],
    },
    colors: { control: "object" },
    distort: { control: { type: "number", min: 0, max: 50, step: 0.5 } },
    paused: { control: "boolean" },
    offset: { control: "object" },
    hoverDampness: { control: { type: "number", min: 0, max: 1, step: 0.05 } },
    rayCount: { control: { type: "number", min: 0, step: 1 } },
    mixBlendMode: {
      control: "select",
      options: [
        "none",
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
  },
} satisfies Meta<typeof PrismaticBurst>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Frozen mid-animation: the ray march time stops advancing, so the burst
// holds a single static frame instead of tumbling.
export const Paused: Story = {
  args: {
    paused: true,
  },
};
