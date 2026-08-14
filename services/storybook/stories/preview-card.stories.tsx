import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/atoms/preview-card";

const meta = {
  title: "Atoms/PreviewCard",
  component: PreviewCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A popup that previews linked content when its trigger is hovered, without navigating away from the page.",
      },
    },
  },
} satisfies Meta<typeof PreviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="text-sm">
      Built with{" "}
      <PreviewCard>
        <PreviewCardTrigger
          render={
            <a
              href="https://base-ui.com"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-foreground underline"
            >
              Base UI
            </a>
          }
        />
        <PreviewCardPopup>
          <div className="flex flex-col gap-2">
            <CalendarDays className="size-8 text-muted-foreground" />
            <div className="font-semibold">Base UI</div>
            <p className="text-muted-foreground">
              Unstyled, accessible React components for building high-quality
              design systems and web applications.
            </p>
          </div>
        </PreviewCardPopup>
      </PreviewCard>
      .
    </div>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <div className="text-sm">
      Hover{" "}
      <PreviewCard>
        <PreviewCardTrigger
          delay={50}
          render={
            <a
              href="#preview"
              className="font-medium text-foreground underline"
            >
              this link
            </a>
          }
        />
        <PreviewCardPopup>
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Quick preview</div>
            <p className="text-muted-foreground">
              This card opens almost instantly thanks to a 50ms trigger delay.
            </p>
          </div>
        </PreviewCardPopup>
      </PreviewCard>{" "}
      to see it open fast.
    </div>
  ),
};

// `PreviewCardTrigger`'s open delay defaults to 600ms; passing `delay={0}`
// keeps this interaction test fast and deterministic.
export const OpensOnHover: Story = {
  render: () => (
    <div className="text-sm">
      Hover{" "}
      <PreviewCard>
        <PreviewCardTrigger
          delay={0}
          render={
            <a
              href="#preview"
              className="font-medium text-foreground underline"
            >
              this link
            </a>
          }
        />
        <PreviewCardPopup>
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Quick preview</div>
            <p className="text-muted-foreground">
              Preview content appears on hover.
            </p>
          </div>
        </PreviewCardPopup>
      </PreviewCard>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("link", { name: /this link/i }));
    const screen = within(document.body);
    await waitFor(() =>
      expect(
        screen.getByText(/preview content appears on hover/i),
      ).toBeVisible(),
    );
  },
};
