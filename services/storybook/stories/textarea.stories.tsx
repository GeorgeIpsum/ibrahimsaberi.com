import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Textarea } from "@/components/atoms/textarea";

const sizes = ["sm", "default", "lg"] as const;

const meta = {
  title: "Atoms/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A styled multi-line text input that grows with its content.",
      },
    },
  },
  args: {
    placeholder: "Type your message…",
    size: "default",
    disabled: false,
  },
  argTypes: {
    size: { control: "select", options: sizes },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-3">
      {sizes.map((size) => (
        <Textarea key={size} {...args} placeholder={size} size={size} />
      ))}
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "Storybook renders this with the real app fonts and tokens, so the textarea grows with its content thanks to field-sizing.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "This textarea is disabled." },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "Something looks off here." },
};

export const TypesValue: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox");
    await userEvent.type(textarea, "hello world");
    await expect(textarea).toHaveValue("hello world");
  },
};
