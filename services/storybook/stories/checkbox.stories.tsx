import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";

const meta = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  args: { disabled: false, defaultChecked: false, indeterminate: false },
  argTypes: {
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    indeterminate: { control: "boolean" },
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
