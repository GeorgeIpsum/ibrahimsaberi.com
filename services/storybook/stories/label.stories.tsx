import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Mail } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

const meta = {
  title: "Atoms/Label",
  component: Label,
  parameters: { layout: "centered" },
  args: { children: "Email address" },
  argTypes: { children: { control: "text" } },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = {
  render: (args) => (
    <Label {...args}>
      <Mail className="size-4" />
      {args.children}
    </Label>
  ),
};

export const LabellingAnInput: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
