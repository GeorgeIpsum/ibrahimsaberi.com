import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/components/atoms/field";
import { Fieldset, FieldsetLegend } from "@/components/atoms/fieldset";
import { Input } from "@/components/atoms/input";

const meta = {
  title: "Atoms/Fieldset",
  component: Fieldset,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Groups a shared legend with a set of related form fields.",
      },
    },
  },
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Fieldset {...args} className="flex flex-col gap-4">
      <FieldsetLegend>Billing details</FieldsetLegend>
      <Field name="name">
        <FieldLabel>Full name</FieldLabel>
        <FieldControl render={<Input placeholder="Jane Doe" />} />
      </Field>
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          render={<Input type="email" placeholder="jane@example.com" />}
        />
      </Field>
    </Fieldset>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <Fieldset className="flex flex-col gap-4">
      <FieldsetLegend>Shipping address</FieldsetLegend>
      <Field name="street">
        <FieldLabel>Street</FieldLabel>
        <FieldControl render={<Input placeholder="123 Main St" />} />
        <FieldDescription>Include apartment or suite number.</FieldDescription>
      </Field>
      <Field name="city">
        <FieldLabel>City</FieldLabel>
        <FieldControl render={<Input placeholder="Springfield" />} />
      </Field>
    </Fieldset>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Fieldset className="flex flex-col gap-4" disabled>
      <FieldsetLegend>Account (read-only)</FieldsetLegend>
      <Field name="username">
        <FieldLabel>Username</FieldLabel>
        <FieldControl render={<Input defaultValue="janedoe" />} />
      </Field>
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          render={<Input type="email" defaultValue="jane@example.com" />}
        />
      </Field>
    </Fieldset>
  ),
};
