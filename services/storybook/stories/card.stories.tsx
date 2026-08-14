import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";

const meta = {
  title: "Atoms/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A bordered container for grouping related content into header, body and footer sections.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Project Aurora</CardTitle>
        <CardDescription>
          A short summary of what this card is about.
        </CardDescription>
        <CardAction>
          <Button size="icon-sm" variant="ghost" aria-label="More options">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Body content goes here. Cards compose header, content and footer
          slots, each with its own spacing rules.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="py-6">
        <p className="text-sm">A minimal card with only content.</p>
      </CardContent>
    </Card>
  ),
};

// `CardFrame` groups several `Card`s into one visually joined stack (shared
// rounded corners, collapsed borders between items) using the
// `CardFrame*` slot components instead of the plain `Card*` ones.
export const FrameOfCards: Story = {
  render: () => (
    <CardFrame className="w-96">
      <Card>
        <CardFrameHeader>
          <CardFrameTitle>Pro plan</CardFrameTitle>
          <CardFrameDescription>
            $20 / month, billed annually
          </CardFrameDescription>
          <CardFrameAction>
            <Button size="sm" variant="outline">
              Change
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <CardFrameFooter className="border-t text-muted-foreground text-sm">
          Renews on Jan 1, 2027
        </CardFrameFooter>
      </Card>
      <Card>
        <CardFrameHeader>
          <CardFrameTitle>Payment method</CardFrameTitle>
          <CardFrameDescription>Visa ending in 4242</CardFrameDescription>
          <CardFrameAction>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
      </Card>
    </CardFrame>
  ),
};
