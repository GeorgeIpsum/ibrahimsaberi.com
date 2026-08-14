import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EvilEye from "@/components/shaders/evil-eye";

const meta = {
  title: "Shaders/EvilEye",
  component: EvilEye,
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
          "A procedurally noised, flame-flickering iris shader whose pupil tracks the cursor.",
      },
    },
  },
  args: {
    eyeColor: "#FF6F37",
    intensity: 1.5,
    pupilSize: 0.6,
    irisWidth: 0.25,
    glowIntensity: 0.35,
    scale: 0.8,
    noiseScale: 1.0,
    pupilFollow: 1.0,
    flameSpeed: 1.0,
    backgroundColor: "#000000",
  },
  argTypes: {
    eyeColor: { control: "color" },
    intensity: { control: { type: "number", step: 0.1 } },
    pupilSize: { control: { type: "number", step: 0.05 } },
    irisWidth: { control: { type: "number", step: 0.05 } },
    glowIntensity: { control: { type: "number", step: 0.05 } },
    scale: { control: { type: "number", step: 0.05 } },
    noiseScale: { control: { type: "number", step: 0.1 } },
    pupilFollow: { control: { type: "number", step: 0.1 } },
    flameSpeed: { control: { type: "number", step: 0.1 } },
    backgroundColor: { control: "color" },
  },
} satisfies Meta<typeof EvilEye>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// A cold, slow-burning iris: blue-cyan eye color, dim glow, and a lazy
// flame speed instead of the fiery orange default.
export const Cold: Story = {
  args: {
    eyeColor: "#37B4FF",
    backgroundColor: "#020617",
    glowIntensity: 0.2,
    flameSpeed: 0.4,
    pupilFollow: 0.4,
  },
};
