import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/atoms/field";
import { Input } from "@/components/atoms/input";

const meta = {
  title: "Atoms/Field",
  component: Field,
  parameters: { layout: "centered" },
  args: { name: "email", disabled: false },
  argTypes: {
    name: { control: "text" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Field {...args}>
      <FieldLabel>Email address</FieldLabel>
      <FieldControl
        render={<Input type="email" placeholder="you@example.com" />}
      />
    </Field>
  ),
};

export const WithDescription: Story = {
  render: (args) => (
    <Field {...args}>
      <FieldLabel>Email address</FieldLabel>
      <FieldControl
        render={<Input type="email" placeholder="you@example.com" />}
      />
      <FieldDescription>
        We'll never share your email with anyone.
      </FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <Field {...args}>
      <FieldLabel>Email address</FieldLabel>
      <FieldControl
        render={<Input type="email" defaultValue="not-an-email" aria-invalid />}
      />
      <FieldError match>Please enter a valid email address.</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Field {...args}>
      <FieldLabel>Email address</FieldLabel>
      <FieldControl
        render={<Input type="email" defaultValue="you@example.com" />}
      />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  ),
};
