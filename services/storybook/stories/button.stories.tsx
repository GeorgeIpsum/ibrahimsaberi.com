import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/button";

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
  "destructive-outline",
] as const;

const textSizes = ["xs", "sm", "default", "lg", "xl"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg", "icon-xl"] as const;

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The primary interactive control for triggering actions, with variant, size and loading states.",
      },
    },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: "select", options: variants },
    size: { control: "select", options: [...textSizes, ...iconSizes] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {textSizes.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>
        <Check />
        Confirm
      </Button>
      <Button {...args} variant="outline">
        Next
        <ArrowRight />
      </Button>
      <Button {...args} variant="destructive">
        <Trash2 />
        Delete
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {iconSizes.map((size) => (
        <Button key={size} {...args} size={size} aria-label="Confirm">
          <Check />
        </Button>
      ))}
    </div>
  ),
};

export const Loading: Story = { args: { loading: true } };

export const Disabled: Story = { args: { disabled: true } };
