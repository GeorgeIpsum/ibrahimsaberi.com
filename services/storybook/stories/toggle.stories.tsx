import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bold, Star } from "lucide-react";
import { Toggle } from "@/components/atoms/toggle";

const variants = ["default", "outline"] as const;
const sizes = ["sm", "default", "lg"] as const;

const meta = {
  title: "Atoms/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
  args: {
    children: "Toggle",
    variant: "default",
    size: "default",
    defaultPressed: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: "select", options: variants },
    size: { control: "select", options: sizes },
    defaultPressed: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Toggle key={variant} {...args} variant={variant}>
          {variant}
        </Toggle>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {sizes.map((size) => (
        <Toggle key={size} {...args} size={size}>
          {size}
        </Toggle>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle {...args} aria-label="Toggle bold">
        <Bold />
        Bold
      </Toggle>
      <Toggle {...args} variant="outline" aria-label="Toggle favorite">
        <Star />
        Favorite
      </Toggle>
    </div>
  ),
};

export const IconOnly: Story = {
  render: (args) => (
    <Toggle {...args} aria-label="Toggle bold">
      <Bold />
    </Toggle>
  ),
};

export const Pressed: Story = { args: { defaultPressed: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledPressed: Story = {
  args: { disabled: true, defaultPressed: true },
};
