import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "@/components/atoms/separator";

const orientations = ["horizontal", "vertical"] as const;

const meta = {
  title: "Atoms/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A thin visual divider between content, horizontal or vertical.",
      },
    },
  },
  args: { orientation: "horizontal" },
  argTypes: {
    orientation: { control: "inline-radio", options: orientations },
  },
  decorators: [
    (Story) => (
      <div className="flex h-24 w-72 items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-full">
      <p className="text-foreground text-sm">Above the separator</p>
      <Separator {...args} orientation="horizontal" className="my-4" />
      <p className="text-muted-foreground text-sm">Below the separator</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span className="text-foreground">Docs</span>
      <Separator {...args} orientation="vertical" />
      <span className="text-foreground">Guides</span>
      <Separator {...args} orientation="vertical" />
      <span className="text-foreground">API</span>
    </div>
  ),
};
