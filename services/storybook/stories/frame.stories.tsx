import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/atoms/button";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/atoms/frame";

const meta = {
  title: "Atoms/Frame",
  component: Frame,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A muted container that groups one or more panels with a soft inset background.",
      },
    },
  },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single inset panel inside the frame's muted background.
export const Default: Story = {
  render: () => (
    <Frame className="w-96">
      <FramePanel>
        <p className="text-sm">
          A frame wraps one or more panels in a soft, inset container. Each
          panel sits on a raised background with subtle borders.
        </p>
      </FramePanel>
    </Frame>
  ),
};

// Multiple panels stack vertically with a 1px gap (the muted frame shows
// through between them).
export const MultiplePanels: Story = {
  render: () => (
    <Frame className="w-96">
      <FramePanel>
        <FrameTitle>General</FrameTitle>
        <FrameDescription>
          Configure the basics for this workspace.
        </FrameDescription>
      </FramePanel>
      <FramePanel>
        <FrameTitle>Members</FrameTitle>
        <FrameDescription>
          Invite teammates and manage their access.
        </FrameDescription>
      </FramePanel>
      <FramePanel>
        <FrameTitle>Billing</FrameTitle>
        <FrameDescription>
          Update your plan and payment method.
        </FrameDescription>
      </FramePanel>
    </Frame>
  ),
};

// A panel composing the header / body / footer slots.
export const WithHeaderAndFooter: Story = {
  render: () => (
    <Frame className="w-96">
      <FramePanel className="p-0">
        <FrameHeader>
          <FrameTitle>Notifications</FrameTitle>
          <FrameDescription>
            Choose how you want to be notified.
          </FrameDescription>
        </FrameHeader>
        <div className="px-5 py-4 text-muted-foreground text-sm">
          Email, push, and in-app notification settings live here.
        </div>
        <FrameFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </FrameFooter>
      </FramePanel>
    </Frame>
  ),
};
