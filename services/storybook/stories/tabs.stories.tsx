import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsVariant,
} from "@/components/atoms/tabs";

const tabsVariants: TabsVariant[] = ["default", "underline"];

const meta = {
  title: "Atoms/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A set of content panels shown one at a time, switched via a row of tab buttons.",
      },
    },
  },
  args: { orientation: "horizontal" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Manage your account details and public profile.
      </TabsContent>
      <TabsContent value="password">
        Update your password to keep your account secure.
      </TabsContent>
      <TabsContent value="settings">
        Adjust notification and workspace preferences.
      </TabsContent>
    </Tabs>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {tabsVariants.map((variant) => (
        <Tabs key={variant} defaultValue="account" className="w-80">
          <TabsList variant={variant}>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            Manage your account details.
          </TabsContent>
          <TabsContent value="password">Update your password.</TabsContent>
        </Tabs>
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Manage your account details and public profile.
      </TabsContent>
      <TabsContent value="password">
        Update your password to keep your account secure.
      </TabsContent>
      <TabsContent value="settings">
        Adjust notification and workspace preferences.
      </TabsContent>
    </Tabs>
  ),
};

// Clicking a tab activates it (`aria-selected`) and swaps the visible panel.
// Inactive panels unmount (Base UI's `keepMounted` defaults to false), so the
// previous panel's absence is asserted with `toBeInTheDocument`, which is
// null-safe, rather than `toBeVisible()`.
export const Interaction: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account details.</TabsContent>
      <TabsContent value="password">Update your password.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    const account = canvas.getByRole("tab", { name: /account/i });
    const password = canvas.getByRole("tab", { name: /password/i });

    await expect(account).toHaveAttribute("aria-selected", "true");
    await expect(
      canvas.getByText(/manage your account details/i),
    ).toBeVisible();

    await userEvent.click(password);

    await expect(password).toHaveAttribute("aria-selected", "true");
    await expect(
      await canvas.findByText(/update your password/i),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        canvas.queryByText(/manage your account details/i),
      ).not.toBeInTheDocument(),
    );
  },
};
