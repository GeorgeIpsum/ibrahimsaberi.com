import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";

const options = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  { value: "spacious", label: "Spacious" },
] as const;

const meta = {
  title: "Atoms/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
  render: (args) => (
    <RadioGroup {...args} defaultValue="comfortable">
      {options.map((option) => (
        <Label key={option.value}>
          <RadioGroupItem value={option.value} />
          {option.label}
        </Label>
      ))}
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledItem: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="comfortable">
      <Label>
        <RadioGroupItem value="comfortable" />
        Comfortable
      </Label>
      <Label>
        <RadioGroupItem value="compact" />
        Compact
      </Label>
      <Label className="data-disabled:opacity-64">
        <RadioGroupItem disabled value="spacious" />
        Spacious (unavailable)
      </Label>
    </RadioGroup>
  ),
};
