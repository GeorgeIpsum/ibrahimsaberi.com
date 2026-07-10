import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DatePicker, DateRangePicker } from "@/components/atoms/date-picker";

// Fixed so the calendar's grid (and the play-function assertions) don't
// depend on the date the tests happen to run — mirrors calendar.stories.tsx.
const fixedInitial = new Date(2024, 0, 10);

function DatePickerDemo(
  props: React.ComponentProps<typeof DatePicker>,
): React.ReactElement {
  return (
    <div className="w-64">
      <DatePicker {...props} />
    </div>
  );
}

const meta = {
  title: "Atoms/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A popover-anchored calendar for picking a single date, built on Calendar and Popover.",
      },
    },
  },
  args: { dropdown: false, placeholder: "Pick a date" },
  argTypes: {
    dropdown: { control: "boolean" },
    placeholder: { control: "text" },
  },
  render: (args) => <DatePickerDemo {...args} />,
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Range: Story = {
  render: () => (
    <div className="w-72">
      <DateRangePicker />
    </div>
  ),
};

// Opening the popover (portaled to `document.body`) and picking a day
// updates both the calendar's selected state and the trigger's label. Dates
// are fixed to January 2024 so the day names and formatted label are
// deterministic — the selected-state assertion mirrors
// calendar.stories.tsx's `SelectsDay`, and the label assertion is safe
// because it never depends on the real current year.
export const Interaction: Story = {
  render: () => <DatePickerDemo initial={fixedInitial} />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", {
      name: /january 10th, 2024/i,
    });
    await userEvent.click(trigger);

    const screen = within(document.body);
    const day = await screen.findByRole("button", {
      name: /january 15th, 2024/i,
    });
    const cell = day.closest('[role="gridcell"]');
    await expect(cell).not.toHaveAttribute("aria-selected", "true");

    await userEvent.click(day);

    await waitFor(() => expect(cell).toHaveAttribute("aria-selected", "true"));
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: /january 15th, 2024/i }),
      ).toBeVisible(),
    );
  },
};
