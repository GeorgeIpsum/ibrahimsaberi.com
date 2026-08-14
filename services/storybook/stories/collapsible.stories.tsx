import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronDownIcon } from "lucide-react";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/collapsible";

const meta = {
  title: "Atoms/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A disclosure that toggles a content panel between shown and hidden.",
      },
    },
  },
  args: { disabled: false },
  argTypes: {
    disabled: { control: "boolean" },
  },
  render: (args) => (
    <Collapsible {...args} className="w-72">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between rounded-md border border-input px-3 py-2 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-64">
        Show details
        <ChevronDownIcon className="size-4 shrink-0 opacity-80 transition-transform duration-200 ease-in-out group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="px-3 py-2 text-muted-foreground text-sm">
          Hidden until expanded.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

// Clicking the trigger reveals the panel; clicking again removes it. The
// panel unmounts once closed (Base UI's `keepMounted` defaults to false), so
// the closed-state assertion checks for absence rather than `toBeVisible()`,
// which throws on a `null` element.
export const Interaction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /show details/i });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect(
      await canvas.findByText(/hidden until expanded/i),
    ).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    await waitFor(() =>
      expect(
        canvas.queryByText(/hidden until expanded/i),
      ).not.toBeInTheDocument(),
    );
  },
};
