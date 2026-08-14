import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Balatro from "@/components/shaders/balatro";

const meta = {
  title: "Shaders/Balatro",
  component: Balatro,
  // WebGL (ogl) — the vitest browser addon has no reliable GPU context in headless Chromium,
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
          "A swirling, pixel-filtered plasma shader with a mouse-reactive spin, styled after the Balatro card-back art.",
      },
    },
  },
  args: {
    spinRotation: -2.0,
    spinSpeed: 7.0,
    offset: [0.0, 0.0],
    color1: "#DE443B",
    color2: "#006BB4",
    color3: "#162325",
    contrast: 3.5,
    lighting: 0.4,
    spinAmount: 0.25,
    pixelFilter: 745.0,
    spinEase: 1.0,
    isRotate: false,
    mouseInteraction: true,
  },
  argTypes: {
    spinRotation: { control: { type: "number", step: 0.1 } },
    spinSpeed: { control: { type: "number", step: 0.1 } },
    offset: { control: "object" },
    color1: { control: "color" },
    color2: { control: "color" },
    color3: { control: "color" },
    contrast: { control: { type: "number", step: 0.1 } },
    lighting: { control: { type: "number", step: 0.05 } },
    spinAmount: { control: { type: "number", min: 0, max: 1, step: 0.01 } },
    pixelFilter: { control: { type: "number", min: 1, step: 5 } },
    spinEase: { control: { type: "number", step: 0.1 } },
    isRotate: { control: "boolean" },
    mouseInteraction: { control: "boolean" },
  },
} satisfies Meta<typeof Balatro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Continuous spin engaged: the whole plasma field rotates over time instead
// of only reacting to the spin-amount distortion.
export const Rotating: Story = {
  args: {
    isRotate: true,
  },
};
