import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Input } from "@/components/atoms/input";

const sizes = ["xs", "sm", "default", "lg"] as const;

const meta = {
  title: "Atoms/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A styled single-line text input built on Base UI's Input primitive.",
      },
    },
  },
  args: { placeholder: "Type here…", size: "default", disabled: false },
  argTypes: {
    size: { control: "select", options: sizes },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "file", "number"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-3">
      {sizes.map((size) => (
        <Input key={size} {...args} size={size} placeholder={size} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Disabled" },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "Invalid value" },
};

export const Search: Story = {
  args: { type: "search", placeholder: "Search…" },
};

export const TypesValue: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "hello world");
    await expect(input).toHaveValue("hello world");
  },
};
