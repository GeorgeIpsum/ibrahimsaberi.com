import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Switch } from "@/components/atoms/switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  args: { disabled: false, defaultChecked: false },
  argTypes: {
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
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
