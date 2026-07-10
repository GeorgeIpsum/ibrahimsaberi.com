import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";

const meta = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A tri-state control (checked, unchecked, or indeterminate) for binary choices, built on Base UI's Checkbox primitive.",
      },
    },
  },
  args: {
    disabled: false,
    defaultChecked: false,
    indeterminate: false,
    required: false,
    readOnly: false,
  },
  argTypes: {
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Checkbox defaultChecked={false} />
      <Checkbox defaultChecked />
      <Checkbox indeterminate />
      <Checkbox aria-invalid />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Checkbox defaultChecked={false} disabled />
      <Checkbox defaultChecked disabled />
      <Checkbox indeterminate disabled />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Label>
      <Checkbox defaultChecked />
      Accept terms and conditions
    </Label>
  ),
};

export const Toggles: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox");
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};
