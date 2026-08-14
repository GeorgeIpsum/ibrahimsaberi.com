import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AsciiHero } from "@/components/backgrounds/ascii-hero";

const meta = {
  title: "Backgrounds/AsciiHero",
  component: AsciiHero,
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
          "A canvas-rendered, cursor-reactive ASCII field — usable as a chrome'd hero panel or a bare background layer.",
      },
    },
  },
  args: {
    variant: "panel",
    fontSize: 11,
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
    charRamp:
      " .`'\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    colorful: false,
    baseOpacity: 1,
    reactive: true,
    rippleStrength: 1.4,
    rippleRadius: 6,
    spotlightRadius: 8,
    frameMs: 50,
    reveal: true,
    revealStagger: 22,
    revealDuration: 420,
  },
  argTypes: {
    variant: { control: "radio", options: ["panel", "bare"] },
    cols: { control: { type: "number", min: 1 } },
    rows: { control: { type: "number", min: 1 } },
    fontSize: { control: { type: "number", min: 4 } },
    fontFamily: { control: "text" },
    charRamp: { control: "text" },
    colorful: { control: "boolean" },
    palette: { control: "object" },
    baseOpacity: { control: { type: "number", min: 0, max: 1, step: 0.05 } },
    reactive: { control: "boolean" },
    rippleStrength: { control: { type: "number", step: 0.1 } },
    rippleRadius: { control: { type: "number", min: 0 } },
    spotlightOpacity: {
      control: { type: "number", min: 0, max: 1, step: 0.05 },
    },
    spotlightRadius: { control: { type: "number", min: 0 } },
    frameMs: { control: { type: "number", min: 0 } },
    reveal: { control: "boolean" },
    revealStagger: { control: { type: "number", min: 0 } },
    revealDuration: { control: { type: "number", min: 0 } },
    art: { control: "object" },
  },
} satisfies Meta<typeof AsciiHero>;

export default meta;
type Story = StoryObj<typeof meta>;

// The "panel" variant (default): a bordered, backdropped card sized to fit
// its content — the sized container here just gives it room to center in.
export const Playground: Story = {};

// The "bare" variant drops all chrome, so it needs to be explicitly
// positioned to fill its container — the intended usage as a background
// layer behind foreground content.
export const Bare: Story = {
  args: {
    variant: "bare",
    className: "absolute inset-0",
    colorful: true,
    baseOpacity: 0.18,
    spotlightOpacity: 0.9,
    spotlightRadius: 10,
  },
};
