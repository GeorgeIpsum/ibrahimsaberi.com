import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "@/components/atoms/spinner";

const sizes = ["size-3", "size-4", "size-6", "size-8", "size-12"] as const;

const meta = {
  title: "Atoms/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {sizes.map((size) => (
        <Spinner key={size} className={size} />
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-6 text-foreground" />
      <Spinner className="size-6 text-muted-foreground" />
      <Spinner className="size-6 text-primary" />
      <Spinner className="size-6 text-destructive-foreground" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Spinner className="size-4" />
      <span>Loading…</span>
    </div>
  ),
};
