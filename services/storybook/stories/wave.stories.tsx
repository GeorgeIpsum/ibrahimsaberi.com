import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Wave } from "@/components/text/wave";

const meta = {
  title: "Text/Wave",
  component: Wave,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Splits text into letters that continuously bob up and down with a per-letter delay, like a wave passing through.",
      },
    },
  },
  args: {
    text: "a wave.",
    animateOnHover: false,
    colors: {},
    className: "font-heading text-4xl",
  },
  argTypes: {
    animateOnHover: { control: "boolean" },
    delay: { control: "number" },
    ebb: { control: "text" },
    flow: { control: "text" },
    colors: { control: "object" },
    style: { control: "object" },
  },
} satisfies Meta<typeof Wave>;

export default meta;
type Story = StoryObj<typeof meta>;

// `animateOnHover` is false by default, so the wave animates continuously.
export const Playground: Story = {};

// With `animateOnHover`, letters sit still until hovered instead of
// animating continuously.
export const AnimateOnHover: Story = {
  args: { animateOnHover: true },
};

// `colors.above`/`colors.below` set the drop-shadow cast as each letter
// peaks and dips; unset, they fall back to the app's themed CSS variables.
export const CustomColors: Story = {
  args: {
    colors: {
      above: "1px 1px #22d3ee80",
      below: "2px 2px #f9731680",
    },
  },
};
