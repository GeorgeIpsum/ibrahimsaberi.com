import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FolderOpen, Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/atoms/empty";

const meta = {
  title: "Atoms/Empty",
  component: Empty,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A placeholder layout for empty/zero-data states with optional media, title, description and actions.",
      },
    },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

// A realistic empty state: icon media, title, description and an action.
export const Default: Story = {
  render: () => (
    <Empty className="w-96 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>
          When someone sends you a message it will show up here. Start a
          conversation to get things going.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <Plus />
          New message
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

export const NoResults: Story = {
  render: () => (
    <Empty className="w-96 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t find anything matching your search. Try a different
          keyword or clear your filters.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">Clear filters</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const WithTwoActions: Story = {
  render: () => (
    <Empty className="w-96 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>This project is empty</EmptyTitle>
        <EmptyDescription>
          Create your first file or import an existing project to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>
            <Plus />
            Create file
          </Button>
          <Button variant="outline">Import</Button>
        </div>
      </EmptyContent>
    </Empty>
  ),
};

// `variant="default"` renders the media slot with no decorative card/border.
export const DefaultMedia: Story = {
  render: () => (
    <Empty className="w-96 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia>
          <Inbox className="size-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Your inbox is clear</EmptyTitle>
        <EmptyDescription>
          Nothing needs your attention right now.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
