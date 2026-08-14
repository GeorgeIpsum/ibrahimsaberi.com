import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { TokenStream } from "@/components/text/token-stream";

const meta = {
  title: "Text/TokenStream",
  component: TokenStream,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Reveals text token-by-token behind a blinking caret — the fake AI-streaming effect.",
      },
    },
  },
  args: {
    text: "Reasoning, but visibly.",
    speedMs: [18, 80],
    delayMs: 0,
    loop: false,
    loopDelayMs: 6000,
    hideCaret: false,
    className: "text-2xl",
  },
  argTypes: {
    speedMs: { control: "object" },
    delayMs: { control: "number" },
    loop: { control: "boolean" },
    loopDelayMs: { control: "number" },
    hideCaret: { control: "boolean" },
  },
} satisfies Meta<typeof TokenStream>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// `hideCaret` drops the trailing blinking caret span entirely, streaming or
// not.
export const WithHideCaret: Story = {
  args: { hideCaret: true },
};

// The per-token delay (`speedMs`) is randomized within its [min, max] range,
// but the token sequence itself is deterministic — the same `text` always
// streams in and settles on the same final content. A short, tight speed
// range keeps the wait bounded, and the timeout stays generous for slower
// CI runs.
export const StreamsFullText: Story = {
  args: {
    text: "Stream complete.",
    speedMs: [4, 12],
    hideCaret: true,
  },
  play: async ({ canvas }) => {
    await waitFor(
      () => expect(canvas.getByText("Stream complete.")).toBeVisible(),
      { timeout: 5000 },
    );
  },
};
