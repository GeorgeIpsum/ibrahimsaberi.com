import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/atoms/accordion";

const items = [
  {
    value: "item-1",
    question: "Is it accessible?",
    answer: "Yes. It adheres to the WAI-ARIA design pattern.",
  },
  {
    value: "item-2",
    question: "Is it styled?",
    answer:
      "Yes. It comes with default styles that match the rest of the design system.",
  },
  {
    value: "item-3",
    question: "Is it animated?",
    answer:
      "Yes. It is animated by default, expanding and collapsing the panel height smoothly.",
  },
];

const meta = {
  title: "Atoms/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A vertically stacked set of interactive headings that each reveal an associated panel of content.",
      },
    },
  },
  args: { multiple: false, disabled: false },
  argTypes: {
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Accordion
      multiple={args.multiple}
      disabled={args.disabled}
      defaultValue={["item-1"]}
      className="w-96"
    >
      {items.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionPanel>{answer}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const Single: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]} className="w-96">
      {items.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionPanel>{answer}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion multiple defaultValue={["item-1", "item-2"]} className="w-96">
      {items.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionPanel>{answer}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Accordion disabled defaultValue={["item-1"]} className="w-96">
      {items.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionPanel>{answer}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

// Clicking a closed trigger expands its panel (Base UI Accordion is
// uncontrolled here, so no starting value is set).
export const ExpandsPanel: Story = {
  render: () => (
    <Accordion className="w-96">
      {items.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionPanel>{answer}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /is it accessible/i }),
    );
    await expect(
      await canvas.findByText(/adheres to the wai-aria design pattern/i),
    ).toBeVisible();
  },
};
