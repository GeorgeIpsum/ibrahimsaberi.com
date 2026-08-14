import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Copy,
  Redo,
  Undo,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Group, GroupSeparator, GroupText } from "@/components/atoms/group";

const meta = {
  title: "Atoms/Group",
  component: Group,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Joins adjacent controls (buttons, text) into a single visually connected segment.",
      },
    },
  },
  // `Group` requires `children`; every story below supplies its own via
  // `render`, so this default only satisfies the type and is never shown.
  args: {
    orientation: "horizontal",
    children: (
      <>
        <Button variant="outline">Undo</Button>
        <Button variant="outline">Redo</Button>
      </>
    ),
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

// A horizontal button group: adjacent buttons are joined into one control
// with shared corners and collapsed inner borders.
export const Playground: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="outline">
        <Undo />
        Undo
      </Button>
      <Button variant="outline">
        Redo
        <Redo />
      </Button>
    </Group>
  ),
};

export const ThreeButtons: Story = {
  render: () => (
    <Group>
      <Button variant="outline" size="icon" aria-label="Align left">
        <AlignLeft />
      </Button>
      <Button variant="outline" size="icon" aria-label="Align center">
        <AlignCenter />
      </Button>
      <Button variant="outline" size="icon" aria-label="Align right">
        <AlignRight />
      </Button>
    </Group>
  ),
};

// A split button: a primary action joined to a dropdown trigger via a
// separator.
export const SplitButton: Story = {
  render: () => (
    <Group>
      <Button>Save</Button>
      <GroupSeparator />
      <Button size="icon" aria-label="More save options">
        <ChevronDown />
      </Button>
    </Group>
  ),
};

// A non-interactive labeled segment alongside an action.
export const WithText: Story = {
  render: () => (
    <Group>
      <GroupText>https://</GroupText>
      <Button variant="outline">
        <Copy />
        Copy link
      </Button>
    </Group>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Group orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </Group>
  ),
};
