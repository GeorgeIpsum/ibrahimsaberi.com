import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/atoms/progress";

const values = [0, 33, 66, 100] as const;

const meta = {
  title: "Atoms/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  args: {
    value: 66,
    max: 100,
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    max: { control: { type: "number" } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

// The default Progress renders its own track + indicator when no children are
// passed, so the Playground only needs `value`/`max`.
export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <Progress {...args} aria-label="Loading progress" />
    </div>
  ),
};

export const Values: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      {values.map((value) => (
        <Progress key={value} value={value} aria-label={`${value} percent`} />
      ))}
    </div>
  ),
};

export const WithLabelAndValue: Story = {
  render: (args) => (
    <Progress {...args} className="w-72">
      <div className="flex items-center justify-between">
        <ProgressLabel>Uploading…</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  ),
};

export const CustomValueFormat: Story = {
  render: () => (
    <Progress value={420} max={1024} className="w-72">
      <div className="flex items-center justify-between">
        <ProgressLabel>Download</ProgressLabel>
        <ProgressValue>{(_, value) => `${value ?? 0} / 1024 MB`}</ProgressValue>
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  ),
};

// `value={null}` puts the bar into its indeterminate state.
export const Indeterminate: Story = {
  render: () => (
    <div className="w-72">
      <Progress value={null} aria-label="Loading" />
    </div>
  ),
};
