import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/atoms/button";
import { ToastProvider, toastManager } from "@/components/atoms/toast";

// Toasts auto-dismiss in the app; in the workshop we keep them on screen long
// enough to inspect. Bump down to see the real dismiss timing.
const WORKSHOP_TIMEOUT = 60_000;

const meta = {
  title: "Atoms/Toast",
  component: ToastProvider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Transient, stacked notifications shown in a corner of the viewport to communicate the outcome of an action.",
      },
    },
  },
  args: { position: "bottom-right" },
  argTypes: {
    // Literal values from `ToastPosition` in src/components/atoms/toast.tsx.
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
    },
  },
  decorators: [
    (Story, context) => (
      <ToastProvider position={context.args.position}>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo(): React.ReactElement {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toastManager.add({
          title: "Event created",
          description: "Your event has been added to the calendar.",
          timeout: WORKSHOP_TIMEOUT,
        })
      }
    >
      Show toast
    </Button>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: "Saved",
            description: "Your changes were saved successfully.",
            type: "success",
            timeout: WORKSHOP_TIMEOUT,
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: "Heads up",
            description: "Your subscription expires soon.",
            type: "warning",
            timeout: WORKSHOP_TIMEOUT,
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: "Something went wrong",
            description: "We couldn't save your changes. Try again.",
            type: "error",
            timeout: WORKSHOP_TIMEOUT,
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: "New version available",
            description: "Refresh the page to update.",
            type: "info",
            timeout: WORKSHOP_TIMEOUT,
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toastManager.add({
            title: "Uploading file",
            description: "This may take a moment.",
            type: "loading",
            timeout: WORKSHOP_TIMEOUT,
          })
        }
      >
        Loading
      </Button>
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toastManager.add({
          title: "Message archived",
          description: "The conversation was moved to your archive.",
          actionProps: { children: "Undo" },
          timeout: WORKSHOP_TIMEOUT,
        })
      }
    >
      Show toast with action
    </Button>
  ),
};

// Clicking the trigger adds a toast; its content is portaled to
// `document.body` via `Toast.Portal`, not rendered inside the canvas.
export const ShowsToastOnClick: Story = {
  render: () => <ToastDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /show toast/i }));
    await expect(
      await within(document.body).findByText("Event created"),
    ).toBeVisible();
  },
};
