import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingText } from "@/components/text/loading-text";

const meta = {
  title: "Text/LoadingText",
  component: LoadingText,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A spinner plus animated ellipsis, absolutely positioned to cover its parent — the loading state for a button or panel.",
      },
    },
  },
  args: {
    children: "Loading",
    interval: 500,
    noEllipsis: false,
  },
  argTypes: {
    interval: { control: "number" },
    noEllipsis: { control: "boolean" },
  },
} satisfies Meta<typeof LoadingText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-12 w-48 rounded-md border">
      <LoadingText {...args} />
    </div>
  ),
};

// `noEllipsis` freezes the trailing dots so only the spinner + label render —
// per the source: "I have no idea why you would even use this component if
// you don't want this."
export const NoEllipsis: Story = {
  args: { noEllipsis: true },
  render: (args) => (
    <div className="relative h-12 w-48 rounded-md border">
      <LoadingText {...args} />
    </div>
  ),
};
