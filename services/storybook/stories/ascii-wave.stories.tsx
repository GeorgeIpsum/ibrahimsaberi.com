import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ASCIIText from "@/components/shaders/ascii-wave";

const meta = {
  title: "Shaders/AsciiWave",
  component: ASCIIText,
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
          "A wobbling 3D text plane refracted into a live, cursor-reactive ASCII character grid.",
      },
    },
  },
  args: {
    text: "David!",
    asciiFontSize: 8,
    textFontSize: 200,
    textColor: "#fdf9f3",
    planeBaseHeight: 8,
    enableWaves: true,
  },
  argTypes: {
    text: { control: "text" },
    asciiFontSize: { control: { type: "number", min: 1, step: 1 } },
    textFontSize: { control: { type: "number", min: 1, step: 10 } },
    textColor: { control: "color" },
    planeBaseHeight: { control: { type: "number", min: 0, step: 0.5 } },
    enableWaves: { control: "boolean" },
  },
} satisfies Meta<typeof ASCIIText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Waves disabled: the text plane sits flat and still, only the ASCII
// re-render and hue drift remain.
export const Static: Story = {
  args: {
    text: "STILL",
    enableWaves: false,
  },
};
