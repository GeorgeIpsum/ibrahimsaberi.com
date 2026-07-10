import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/atoms/button";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerMenu,
  DrawerMenuCheckboxItem,
  DrawerMenuGroup,
  DrawerMenuGroupLabel,
  DrawerMenuItem,
  DrawerMenuRadioGroup,
  DrawerMenuRadioItem,
  DrawerMenuSeparator,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/atoms/drawer";

const positions = ["bottom", "right", "left", "top"] as const;

const meta = {
  title: "Atoms/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A panel that slides in from an edge of the screen, swipeable on touch devices, useful for mobile navigation and forms.",
      },
    },
  },
  args: { position: "bottom" },
  argTypes: {
    // Literal values from `DrawerPosition` in src/components/atoms/drawer.tsx.
    position: {
      control: "select",
      options: ["right", "left", "top", "bottom"],
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function EditProfileDemo(props: {
  position?: "right" | "left" | "top" | "bottom";
}): React.ReactElement {
  return (
    <Drawer {...props}>
      <DrawerTrigger render={<Button variant="outline">Open drawer</Button>} />
      <DrawerPopup showBar showCloseButton>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Swipe down or tap outside to
            dismiss.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <p className="text-muted-foreground text-sm">
            Drawer content goes here. The panel scrolls when content overflows.
          </p>
        </DrawerPanel>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline">Cancel</Button>} />
          <DrawerClose render={<Button>Save changes</Button>} />
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
}

export const Default: Story = {
  render: (args) => <EditProfileDemo {...args} />,
};

export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {positions.map((position) => (
        <Drawer key={position} position={position}>
          <DrawerTrigger
            render={<Button variant="outline">{position}</Button>}
          />
          <DrawerPopup showCloseButton>
            <DrawerHeader>
              <DrawerTitle>From {position}</DrawerTitle>
              <DrawerDescription>
                This drawer slides in from the {position} edge.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>
              <p className="text-muted-foreground text-sm">
                Content for the {position} drawer.
              </p>
            </DrawerPanel>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline">Close</Button>} />
            </DrawerFooter>
          </DrawerPopup>
        </Drawer>
      ))}
    </div>
  ),
};

// `variant="inset"` adds a border and rounded corners on every side (rather
// than only the edge facing the viewport) on larger screens.
export const Inset: Story = {
  render: () => (
    <Drawer position="right">
      <DrawerTrigger
        render={<Button variant="outline">Open inset drawer</Button>}
      />
      <DrawerPopup variant="inset" showCloseButton>
        <DrawerHeader>
          <DrawerTitle>Inset drawer</DrawerTitle>
          <DrawerDescription>
            The inset variant floats above the page instead of docking flush to
            the edge.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <p className="text-muted-foreground text-sm">
            Content for the inset drawer.
          </p>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  ),
};

// `DrawerMenu` and friends turn a drawer into a mobile-friendly action menu,
// mirroring the item/checkbox/radio primitives exposed by `Menu`.
export const MobileMenu: Story = {
  render: () => (
    <Drawer position="right">
      <DrawerTrigger render={<Button variant="outline">Open menu</Button>} />
      <DrawerPopup showCloseButton>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <DrawerPanel>
          <DrawerMenu>
            <DrawerMenuGroup>
              <DrawerMenuGroupLabel>Account</DrawerMenuGroupLabel>
              <DrawerMenuItem>Profile</DrawerMenuItem>
              <DrawerMenuItem>Settings</DrawerMenuItem>
            </DrawerMenuGroup>
            <DrawerMenuSeparator />
            <DrawerMenuCheckboxItem variant="switch" defaultChecked>
              Notifications
            </DrawerMenuCheckboxItem>
            <DrawerMenuSeparator />
            <DrawerMenuRadioGroup defaultValue="list">
              <DrawerMenuRadioItem value="list">List view</DrawerMenuRadioItem>
              <DrawerMenuRadioItem value="grid">Grid view</DrawerMenuRadioItem>
            </DrawerMenuRadioGroup>
            <DrawerMenuSeparator />
            <DrawerMenuItem variant="destructive">Log out</DrawerMenuItem>
          </DrawerMenu>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  ),
};

// Clicking the trigger opens the popup, rendered with role="dialog" (drawers
// share Dialog's underlying role logic).
export const OpensOnClick: Story = {
  render: () => <EditProfileDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /open drawer/i }));
    const screen = within(document.body);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
  },
};
