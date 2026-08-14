import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GradientTextReveal } from "@/components/text/gradient-text-reveal";

const defaultColors = ["#c679c4", "#fa3d1d", "#ffb005", "#e1e1fe", "#0358f7"];

const meta = {
  title: "Text/GradientTextReveal",
  component: GradientTextReveal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Sweeps a moving color-gradient band across text to reveal it once the element scrolls into view.",
      },
    },
  },
  args: {
    text: "Gradient reveal",
    colors: defaultColors,
    textColor: "var(--foreground)",
    duration: 1.5,
    delay: 0,
    repeat: false,
    repeatDelay: 0.5,
    startOnView: true,
    once: true,
    fixedWidth: false,
    className: "font-heading text-4xl",
  },
  argTypes: {
    colors: { control: "object" },
    textColor: { control: "text" },
    duration: { control: "number" },
    delay: { control: "number" },
    repeat: { control: "boolean" },
    repeatDelay: { control: "number" },
    startOnView: { control: "boolean" },
    once: { control: "boolean" },
    fixedWidth: { control: "boolean" },
  },
} satisfies Meta<typeof GradientTextReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

// `startOnView`/`once` default to true, so the sweep plays as soon as this
// story mounts centered in the canvas (it's already "in view").
export const Playground: Story = {};

// `text` also accepts an array; with `repeat` the sweep replays and advances
// to the next string after each pass instead of stopping once revealed.
export const MultiTextRepeat: Story = {
  args: {
    text: ["Reasoning", "Reveal", "Repeat"],
    repeat: true,
  },
};
