import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Copy,
  CreditCard,
  LogOut,
  Plus,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/atoms/menu";

const meta = {
  title: "Atoms/Menu",
  component: Menu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline">Open menu</Button>} />
      <MenuPopup className="w-56">
        <MenuGroup>
          <MenuGroupLabel>My Account</MenuGroupLabel>
          <MenuItem>
            <User />
            Profile
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <CreditCard />
            Billing
            <MenuShortcut>⌘B</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <Settings />
            Settings
            <MenuShortcut>⌘S</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <UserPlus />
            Invite users
          </MenuSubTrigger>
          <MenuSubPopup>
            <MenuItem>
              <Copy />
              Copy invite link
            </MenuItem>
            <MenuItem>
              <Plus />
              New team
            </MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <LogOut />
          Log out
        </MenuItem>
      </MenuPopup>
    </Menu>
  ),
};

function CheckboxRadioMenu(): React.ReactElement {
  const [showBookmarks, setShowBookmarks] = React.useState(true);
  const [showUrls, setShowUrls] = React.useState(false);
  const [panel, setPanel] = React.useState("left");

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline">View options</Button>} />
      <MenuPopup className="w-56">
        <MenuGroupLabel>Appearance</MenuGroupLabel>
        <MenuCheckboxItem
          checked={showBookmarks}
          onCheckedChange={setShowBookmarks}
        >
          Show bookmarks
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={showUrls} onCheckedChange={setShowUrls}>
          Show full URLs
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuGroupLabel>Panel position</MenuGroupLabel>
        <MenuRadioGroup value={panel} onValueChange={setPanel}>
          <MenuRadioItem value="left">Left</MenuRadioItem>
          <MenuRadioItem value="right">Right</MenuRadioItem>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

export const CheckboxAndRadio: Story = {
  render: () => <CheckboxRadioMenu />,
};
