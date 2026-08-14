import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Switch } from "@/components/atoms/switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A toggle control for a binary on/off setting, styled as a sliding switch.",
      },
    },
  },
  args: {
    disabled: false,
    defaultChecked: false,
    required: false,
    readOnly: false,
  },
  argTypes: {
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Switch defaultChecked={false} />
      <Switch defaultChecked />
      <Switch defaultChecked={false} disabled />
      <Switch defaultChecked disabled />
    </div>
  ),
};

export const Toggles: Story = {
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("switch");
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};
