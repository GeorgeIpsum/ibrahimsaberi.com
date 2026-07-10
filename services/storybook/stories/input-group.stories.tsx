import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtSign, Mail, Search, User } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/atoms/input-group";

const meta = {
  title: "Atoms/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Wraps an input or textarea with leading/trailing addons such as icons, text, or buttons.",
      },
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupInput type="text" placeholder="Username" />
      <InputGroupAddon>
        <User aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const EndAddon: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupInput type="search" placeholder="Search..." />
      <InputGroupAddon align="inline-end">
        <Search aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const TextAddon: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="text" placeholder="example.com" />
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <AtSign aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput type="email" placeholder="you@example.com" />
      <InputGroupAddon align="inline-end">
        <Button size="xs">
          <Mail />
          Subscribe
        </Button>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupTextarea placeholder="Write your message..." />
      <InputGroupAddon align="block-end" className="justify-end">
        <Button size="xs">Send</Button>
      </InputGroupAddon>
    </InputGroup>
  ),
};
