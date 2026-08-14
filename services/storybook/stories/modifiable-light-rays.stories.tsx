import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ModifiableLightRays } from "@/components/backgrounds/modifiable-light-rays";

const meta = {
  title: "Backgrounds/ModifiableLightRays",
  component: ModifiableLightRays,
  decorators: [
    (Story) => (
      <div className="relative h-[480px] w-[720px] overflow-hidden rounded-lg border bg-background">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "LightRays with its color split into r/g/b/a channels and wired up to the control panel.",
      },
    },
  },
  args: {
    r: 255,
    g: 168,
    b: 92,
    a: 1,
    count: 7,
    blur: 36,
    speed: 14,
    length: "70vh",
  },
  argTypes: {
    r: { control: { type: "number", min: 0, max: 255, step: 1 } },
    g: { control: { type: "number", min: 0, max: 255, step: 1 } },
    b: { control: { type: "number", min: 0, max: 255, step: 1 } },
    a: { control: { type: "number", min: 0, max: 1, step: 0.05 } },
    count: { control: { type: "number", min: 0, max: 30, step: 1 } },
    blur: { control: { type: "number", min: 0 } },
    speed: { control: { type: "number", min: 0.1 } },
    length: { control: "text" },
  },
} satisfies Meta<typeof ModifiableLightRays>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
