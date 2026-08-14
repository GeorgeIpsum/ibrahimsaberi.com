import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/atoms/alert-dialog";
import { Button } from "@/components/atoms/button";

const meta = {
  title: "Atoms/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A modal dialog that interrupts the user to confirm a destructive or otherwise irreversible action.",
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DeleteAccountDemo(): React.ReactElement {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive-outline">Delete account</Button>}
      />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="outline">Cancel</Button>}
          />
          <AlertDialogClose
            render={<Button variant="destructive">Delete</Button>}
          />
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}

export const Default: Story = {
  render: () => <DeleteAccountDemo />,
};

export const BareFooter: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline">Discard changes</Button>}
      />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave now, your edits will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter variant="bare">
          <AlertDialogClose
            render={<Button variant="ghost">Keep editing</Button>}
          />
          <AlertDialogClose
            render={<Button variant="destructive">Discard</Button>}
          />
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  ),
};

// Clicking the trigger opens the popup. Base UI renders alert dialogs with
// role="alertdialog" (a distinct ARIA role from the plain "dialog" role used
// by Dialog/Drawer), so we assert on that role specifically.
export const OpensOnClick: Story = {
  render: () => <DeleteAccountDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /delete account/i }),
    );
    const screen = within(document.body);
    await waitFor(() => expect(screen.getByRole("alertdialog")).toBeVisible());
  },
};
