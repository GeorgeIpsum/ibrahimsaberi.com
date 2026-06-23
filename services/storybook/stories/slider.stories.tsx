import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Slider, SliderValue } from "@/components/atoms/slider";

const meta = {
  title: "Atoms/Slider",
  component: Slider,
  parameters: { layout: "centered" },
  args: {
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
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
