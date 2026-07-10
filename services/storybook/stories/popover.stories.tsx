import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/atoms/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/atoms/popover";

const meta = {
  title: "Atoms/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A non-modal popup anchored to a trigger element, used for supplementary content or controls.",
      },
    },
  },
  args: { modal: false },
  argTypes: {
    modal: { control: "select", options: [false, true, "trap-focus"] },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

function DimensionsDemo(props: {
  modal?: boolean | "trap-focus";
}): React.ReactElement {
  return (
    <Popover {...props}>
      <PopoverTrigger
        render={<Button variant="outline">Open popover</Button>}
      />
      <PopoverContent>
        <div className="flex w-64 flex-col gap-1">
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer. These values apply to the selected
            element only.
          </PopoverDescription>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const Default: Story = {
  render: (args) => <DimensionsDemo {...args} />,
};

export const WithIconTrigger: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="icon" aria-label="Settings" />}
      >
        <Settings2 />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex w-56 flex-col gap-2">
          <PopoverTitle>Settings</PopoverTitle>
          <PopoverDescription>
            Tweak how this workspace behaves.
          </PopoverDescription>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithClose: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline">Open popover</Button>}
      />
      <PopoverContent>
        <div className="flex w-64 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <PopoverTitle>Unsaved changes</PopoverTitle>
            <PopoverDescription>
              You have unsaved changes. Discard them before leaving?
            </PopoverDescription>
          </div>
          <div className="flex justify-end gap-2">
            <PopoverClose render={<Button variant="ghost">Cancel</Button>} />
            <PopoverClose
              render={<Button variant="destructive">Discard</Button>}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                {side}
              </Button>
            }
          />
          <PopoverContent side={side}>
            <PopoverDescription>Anchored on {side}</PopoverDescription>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

// `tooltipStyle` shrinks the popup to a compact, tooltip-like appearance
// while keeping the popover's non-modal, click-to-open behavior.
export const TooltipStyle: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            Hover-style popover
          </Button>
        }
      />
      <PopoverContent tooltipStyle>
        <PopoverDescription>
          A compact, tooltip-styled popup.
        </PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
};

// Clicking the trigger opens the popup, rendered with role="dialog".
export const OpensOnClick: Story = {
  render: () => <DimensionsDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /open popover/i }),
    );
    const screen = within(document.body);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
  },
};
