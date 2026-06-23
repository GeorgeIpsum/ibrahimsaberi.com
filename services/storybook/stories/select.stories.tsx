import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";

const sizes = ["xs", "sm", "default", "lg"] as const;
const fruits = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];

function SelectDemo({ size }: { size?: (typeof sizes)[number] }) {
  return (
    <Select defaultValue="Apple">
      <SelectTrigger size={size} className="w-56">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectPopup>
        {fruits.map((fruit) => (
          <SelectItem key={fruit} value={fruit}>
            {fruit}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

const meta = {
  title: "Atoms/Select",
  component: Select,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <SelectDemo /> };

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {sizes.map((size) => (
        <SelectDemo key={size} size={size} />
      ))}
    </div>
  ),
};
