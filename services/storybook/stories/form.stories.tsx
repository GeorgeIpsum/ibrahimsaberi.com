import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Button } from "@/components/atoms/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/atoms/field";
import { Fieldset, FieldsetLegend } from "@/components/atoms/fieldset";
import { Form } from "@/components/atoms/form";
import { Input } from "@/components/atoms/input";

const validationModes = ["onSubmit", "onBlur", "onChange"] as const;

const meta = {
  title: "Atoms/Form",
  component: Form,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A native form wrapper with consolidated field error handling, built on Base UI's Form primitive.",
      },
    },
  },
  args: { validationMode: "onSubmit" },
  argTypes: {
    validationMode: { control: "select", options: validationModes },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Form
      {...args}
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          render={<Input type="email" placeholder="you@example.com" required />}
        />
        <FieldError match="valueMissing">An email is required.</FieldError>
        <FieldError match="typeMismatch">
          Enter a valid email address.
        </FieldError>
      </Field>
      <Field name="password">
        <FieldLabel>Password</FieldLabel>
        <FieldControl
          render={
            <Input
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />
          }
        />
        <FieldDescription>Must be at least 8 characters.</FieldDescription>
        <FieldError match="tooShort">Password is too short.</FieldError>
      </Field>
      <Button type="submit" className="mt-2">
        Sign in
      </Button>
    </Form>
  ),
};

export const WithFieldset: Story = {
  render: () => (
    <Form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <Fieldset className="flex flex-col gap-4">
        <FieldsetLegend>Contact</FieldsetLegend>
        <Field name="name">
          <FieldLabel>Name</FieldLabel>
          <FieldControl render={<Input placeholder="Jane Doe" required />} />
          <FieldError match="valueMissing">Please enter your name.</FieldError>
        </Field>
        <Field name="email">
          <FieldLabel>Email</FieldLabel>
          <FieldControl
            render={
              <Input type="email" placeholder="jane@example.com" required />
            }
          />
          <FieldError match="valueMissing">Please enter your email.</FieldError>
        </Field>
      </Fieldset>
      <Button type="submit">Submit</Button>
    </Form>
  ),
};

export const ShowsValidationError: Story = {
  render: () => (
    <Form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          render={<Input type="email" placeholder="you@example.com" required />}
        />
        <FieldError match="valueMissing">An email is required.</FieldError>
      </Field>
      <Button className="mt-2" type="submit">
        Sign in
      </Button>
    </Form>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /sign in/i }));
    await expect(await canvas.findByText(/email is required/i)).toBeVisible();
  },
};

export const ServerErrors: Story = {
  render: () => (
    <Form
      className="flex flex-col gap-4"
      errors={{ email: "This email is already registered." }}
      onSubmit={(e) => e.preventDefault()}
    >
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          render={<Input type="email" defaultValue="taken@example.com" />}
        />
        <FieldError />
      </Field>
      <Button type="submit">Create account</Button>
    </Form>
  ),
};
