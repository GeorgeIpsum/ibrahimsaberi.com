import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@/components/atoms/label";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/atoms/number-field";

const sizes = ["sm", "default", "lg"] as const;

const meta = {
  title: "Atoms/NumberField",
  component: NumberField,
  parameters: { layout: "centered" },
  args: {
    size: "default",
    defaultValue: 5,
    disabled: false,
    min: 0,
    max: 100,
    step: 1,
  },
  argTypes: {
    size: { control: "select", options: sizes },
    disabled: { control: "boolean" },
    defaultValue: { control: "number" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <NumberField {...args}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  ),
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-48 flex-col gap-3">
      {sizes.map((size) => (
        <NumberField key={size} {...args} size={size}>
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Currency: Story = {
  args: {
    defaultValue: 1499,
    format: { style: "currency", currency: "USD" },
    step: 1,
  },
};

export const WithScrubArea: Story = {
  render: (args) => (
    <NumberField {...args}>
      <NumberFieldScrubArea label="Quantity" />
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <NumberField {...args} id="guests">
      <Label htmlFor="guests">Guests</Label>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  ),
};
