import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUp, Command } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/atoms/kbd";

const meta = {
  title: "Atoms/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Renders a keyboard key or shortcut combination.",
      },
    },
  },
  args: { children: "K" },
  argTypes: { children: { control: "text" } },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SingleKeys: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>?</Kbd>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Kbd>
        <Command />
      </Kbd>
      <Kbd>
        <ArrowUp />
      </Kbd>
    </div>
  ),
};

export const Combos: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <KbdGroup>
        <Kbd>
          <Command />
        </Kbd>
        <span className="text-muted-foreground text-xs">+</span>
        <Kbd>K</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span className="text-muted-foreground text-xs">+</span>
        <Kbd>
          <ArrowUp />
        </Kbd>
        <span className="text-muted-foreground text-xs">+</span>
        <Kbd>P</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Shift</Kbd>
        <span className="text-muted-foreground text-xs">+</span>
        <Kbd>Enter</Kbd>
      </KbdGroup>
    </div>
  ),
};
