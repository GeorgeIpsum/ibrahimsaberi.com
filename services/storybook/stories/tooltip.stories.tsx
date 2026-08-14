import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A small popup that shows a description when its trigger is hovered or focused.",
      },
    },
  },
  args: {
    disabled: false,
    trackCursorAxis: "none",
    disableHoverablePopup: false,
  },
  argTypes: {
    disabled: { control: "boolean" },
    trackCursorAxis: { control: "select", options: ["none", "x", "y", "both"] },
    disableHoverablePopup: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger
            render={
              <Button variant="outline" size="sm">
                {side}
              </Button>
            }
          />
          <TooltipContent side={side}>On {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

// `TooltipTrigger`'s open delay defaults to 600ms; passing `delay={0}` keeps
// this interaction test fast and deterministic.
export const OpensOnHover: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={<Button variant="outline">Hover me</Button>}
      />
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: /hover me/i }));
    const screen = within(document.body);
    await waitFor(() =>
      expect(screen.getByText(/add to library/i)).toBeVisible(),
    );
  },
};
