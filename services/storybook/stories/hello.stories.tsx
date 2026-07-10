import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hello } from "@/components/text/hello";
import { ThemeProvider } from "@/features/theme";

const meta = {
  title: "Text/Hello",
  component: Hello,
  // Async server component (awaits `connection()` from `next/server`, shimmed
  // in main.ts) rendered via the `experimentalRSC` feature flag; random
  // greeting + ASCII art per render, so it's excluded from the render-smoke
  // test sweep.
  tags: ["!test"],
  // `Title`'s ascii-hero background reads `useTheme()`, which throws outside
  // a `ThemeProvider` — the app supplies one in the root layout, no story has
  // needed it yet, so it's wired here rather than globally in preview.tsx.
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light" defaultContrast="normal">
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "An async server component — awaits a shimmed `connection()` then renders the `Title` hero with a random ASCII art and greeting, via Storybook's `experimentalRSC` support.",
      },
    },
  },
} satisfies Meta<typeof Hello>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// A fixed `default` greeting skips the random pick, for a deterministic
// screenshot/visual-check target.
export const Fixed: Story = {
  args: { default: "Hello, Storybook" },
};
