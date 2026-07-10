import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { expect, userEvent, waitFor } from "storybook/test";
import { Calendar } from "@/components/atoms/calendar";

// Fixed so the calendar's grid (and any play-function assertions) don't
// depend on the date the tests happen to run.
const fixedMonth = new Date(2024, 0, 1);

const meta = {
  title: "Atoms/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A date-picker grid (built on react-day-picker) supporting single, multiple and range selection.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={fixedMonth}
      className="rounded-lg border"
    />
  ),
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

function MultipleCalendar(): React.ReactElement {
  const [selected, setSelected] = React.useState<Date[] | undefined>([
    new Date(2024, 0, 3),
    new Date(2024, 0, 10),
    new Date(2024, 0, 17),
  ]);

  return (
    <Calendar
      mode="multiple"
      defaultMonth={fixedMonth}
      selected={selected}
      onSelect={setSelected}
      className="rounded-lg border"
    />
  );
}

export const Multiple: Story = {
  render: () => <MultipleCalendar />,
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

// `disabled` accepts a matcher (here, everything before Jan 10 2024) — those
// day buttons become non-interactive and struck through.
export const Disabled: Story = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={fixedMonth}
      disabled={{ before: new Date(2024, 0, 10) }}
      className="rounded-lg border"
    />
  ),
};

function InteractiveCalendar(): React.ReactElement {
  const [selected, setSelected] = React.useState<Date | undefined>(undefined);

  return (
    <Calendar
      mode="single"
      defaultMonth={fixedMonth}
      selected={selected}
      onSelect={setSelected}
      className="rounded-lg border"
    />
  );
}

// Clicking a day selects it — asserted on the day cell's `aria-selected`
// state, which react-day-picker sets independently of the visible day label.
export const SelectsDay: Story = {
  render: () => <InteractiveCalendar />,
  play: async ({ canvas }) => {
    const day = canvas.getByRole("button", { name: /January 15th, 2024/i });
    const cell = day.closest('[role="gridcell"]');
    await expect(cell).not.toHaveAttribute("aria-selected", "true");

    await userEvent.click(day);

    await waitFor(() => expect(cell).toHaveAttribute("aria-selected", "true"));
  },
};
