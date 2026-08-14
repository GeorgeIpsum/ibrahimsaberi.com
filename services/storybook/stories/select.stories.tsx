import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";

const sizes = ["xs", "sm", "default", "lg"] as const;
const fruits = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];

function SelectDemo({
  size,
  disabled,
}: {
  size?: (typeof sizes)[number];
  disabled?: boolean;
}) {
  return (
    <Select defaultValue="Apple" disabled={disabled}>
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

function MultiSelectDemo() {
  return (
    <Select defaultValue={["Apple", "Banana"]} multiple>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select fruits" />
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
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A native-select-like dropdown for choosing one (or multiple) options from a popup list.",
      },
    },
  },
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SelectDemo disabled={args.disabled} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {sizes.map((size) => (
        <SelectDemo key={size} size={size} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <SelectDemo disabled={args.disabled} />,
};

export const Multiple: Story = {
  render: () => <MultiSelectDemo />,
};

export const SelectsOption: Story = {
  render: () => <SelectDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox"));
    const screen = within(document.body);
    await userEvent.click(
      await screen.findByRole("option", { name: "Banana" }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("combobox")).toHaveTextContent("Banana"),
    );
  },
};
