import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/atoms/calendar";

const meta = {
  title: "Atoms/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Calendar mode="single" className="rounded-lg border" />,
};

function SelectedCalendar(): React.ReactElement {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={setSelected}
      className="rounded-lg border"
    />
  );
}

export const Selected: Story = {
  render: () => <SelectedCalendar />,
};

function RangeCalendar(): React.ReactElement {
  const today = new Date();
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: today,
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
  });

  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
      className="rounded-lg border"
    />
  );
}

export const Range: Story = {
  render: () => <RangeCalendar />,
};
