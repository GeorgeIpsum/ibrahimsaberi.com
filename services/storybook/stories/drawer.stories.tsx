import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/atoms/button";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/atoms/drawer";

const positions = ["bottom", "right", "left", "top"] as const;

const meta = {
  title: "Atoms/Drawer",
  component: Drawer,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Drawer>
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
  ),
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
