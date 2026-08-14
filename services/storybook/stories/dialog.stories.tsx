import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";

const meta = {
  title: "Atoms/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A modal window overlaid on the page, used for focused tasks that require the user's attention before returning to the page.",
      },
    },
  },
  args: { modal: true, disablePointerDismissal: false },
  argTypes: {
    modal: { control: "select", options: [true, false, "trap-focus"] },
    disablePointerDismissal: { control: "boolean" },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DeleteProjectDemo(props: {
  modal?: boolean | "trap-focus";
  disablePointerDismissal?: boolean;
}): React.ReactElement {
  return (
    <Dialog {...props}>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            project and all of its data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <DialogClose render={<Button variant="destructive">Delete</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Default: Story = {
  render: (args) => <DeleteProjectDemo {...args} />,
};

export const BareFooter: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline">Discard changes</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discard unsaved changes?</DialogTitle>
          <DialogDescription>
            You have unsaved changes. If you leave now, your edits will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="ghost">Keep editing</Button>} />
          <DialogClose
            render={<Button variant="destructive">Discard</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Clicking the trigger opens the popup, rendered with role="dialog".
export const OpensOnClick: Story = {
  render: () => <DeleteProjectDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /open dialog/i }));
    const screen = within(document.body);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    // The popup portals to <body>, outside the canvas — it only receives the
    // app fonts if the next/font variables are applied at the document root,
    // the way src/app/layout.tsx does.
    expect(getComputedStyle(screen.getByRole("dialog")).fontFamily).toContain(
      "Figtree",
    );
  },
};
