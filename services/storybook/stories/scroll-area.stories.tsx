import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea } from "@/components/atoms/scroll-area";

const tags = Array.from({ length: 50 }, (_, i) => `v1.2.0-beta.${i + 1}`);

const meta = {
  title: "Atoms/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <div className="h-72 w-56 rounded-md border">
      <ScrollArea className="p-4">
        <div className="mb-2 font-medium text-sm">Tags</div>
        <div className="flex flex-col gap-2 text-sm">
          {tags.map((tag) => (
            <div key={tag} className="text-muted-foreground">
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const WithScrollFade: Story = {
  render: () => (
    <div className="h-72 w-56 rounded-md border">
      <ScrollArea scrollFade scrollbarGutter className="p-4">
        <div className="mb-2 font-medium text-sm">Tags</div>
        <div className="flex flex-col gap-2 text-sm">
          {tags.map((tag) => (
            <div key={tag} className="text-muted-foreground">
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 rounded-md border">
      <ScrollArea className="p-4">
        <div className="flex w-max gap-3">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i.toString()}
              className="flex size-24 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-sm"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
