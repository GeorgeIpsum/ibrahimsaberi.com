import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Checkbox } from "@/components/atoms/checkbox";
import { CheckboxGroup } from "@/components/atoms/checkbox-group";
import { Label } from "@/components/atoms/label";

const options = [
  { value: "fern", label: "Fern" },
  { value: "hosta", label: "Hosta" },
  { value: "moss", label: "Moss" },
  { value: "ivy", label: "Ivy" },
] as const;

const meta = {
  title: "Atoms/CheckboxGroup",
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Groups multiple checkboxes and manages their combined value as an array, with optional parent "select all" support.',
      },
    },
  },
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
  render: (args) => (
    <CheckboxGroup {...args} defaultValue={["fern", "moss"]}>
      {options.map((option) => (
        <Label key={option.value}>
          <Checkbox value={option.value} />
          {option.label}
        </Label>
      ))}
    </CheckboxGroup>
  ),
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithParent: Story = {
  render: (args) => {
    const allValues = options.map((option) => option.value);
    return (
      <CheckboxGroup {...args} allValues={allValues} defaultValue={["fern"]}>
        <Label className="font-semibold">
          <Checkbox parent />
          Select all plants
        </Label>
        <div className="flex flex-col items-start gap-3 ps-6">
          {options.map((option) => (
            <Label key={option.value}>
              <Checkbox value={option.value} />
              {option.label}
            </Label>
          ))}
        </div>
      </CheckboxGroup>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const TogglesItem: Story = {
  play: async ({ canvas }) => {
    const ivy = canvas.getByRole("checkbox", { name: "Ivy" });
    await expect(ivy).not.toBeChecked();
    await userEvent.click(ivy);
    await expect(ivy).toBeChecked();
  },
};
