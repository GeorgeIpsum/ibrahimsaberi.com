import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings2 } from "lucide-react";
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
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
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
  ),
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
