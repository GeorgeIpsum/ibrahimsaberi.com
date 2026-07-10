import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Slider, SliderValue } from "@/components/atoms/slider";

const orientations = ["horizontal", "vertical"] as const;

const meta = {
  title: "Atoms/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A draggable control for selecting one or more numeric values within a range.",
      },
    },
  },
  args: {
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    orientation: "horizontal",
  },
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
    orientation: { control: "select", options: orientations },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithValue: Story = {
  render: (args) => (
    <Slider {...args} defaultValue={40}>
      <SliderValue />
    </Slider>
  ),
};

export const Steps: Story = {
  args: { defaultValue: 50, step: 10 },
  render: (args) => (
    <Slider {...args}>
      <SliderValue />
    </Slider>
  ),
};

export const Range: Story = {
  args: { defaultValue: [25, 75], minStepsBetweenValues: 10 },
  render: (args) => (
    <Slider {...args}>
      <SliderValue />
    </Slider>
  ),
};

export const Percentage: Story = {
  args: {
    defaultValue: 0.6,
    min: 0,
    max: 1,
    step: 0.01,
    format: { style: "percent" },
  },
  render: (args) => (
    <Slider {...args}>
      <SliderValue />
    </Slider>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 30 },
};

export const KeyboardIncrement: Story = {
  args: { defaultValue: 40 },
  render: (args) => (
    <Slider {...args}>
      <SliderValue />
    </Slider>
  ),
  play: async ({ canvas }) => {
    const thumb = canvas.getByRole("slider");
    const before = Number(thumb.getAttribute("aria-valuenow"));
    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => {
      const after = Number(thumb.getAttribute("aria-valuenow"));
      expect(after).toBeGreaterThan(before);
    });
  },
};
