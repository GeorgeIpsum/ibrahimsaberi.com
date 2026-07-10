import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/pagination";

const meta = {
  title: "Atoms/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Navigation controls for moving between pages of paginated content.",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const FirstPage: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" disabled />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

// Mirrors `FirstPage`: `PaginationNext` is disabled once the last page is
// active.
export const LastPage: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" disabled />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

const pageNumbers = [1, 2, 3];

function InteractivePagination(): React.ReactElement {
  const [page, setPage] = React.useState(1);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            disabled={page === pageNumbers[0]}
            onClick={(event) => {
              event.preventDefault();
              setPage((current) => Math.max(pageNumbers[0], current - 1));
            }}
          />
        </PaginationItem>
        {pageNumbers.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              isActive={page === pageNumber}
              onClick={(event) => {
                event.preventDefault();
                setPage(pageNumber);
              }}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            disabled={page === pageNumbers.at(-1)}
            onClick={(event) => {
              event.preventDefault();
              setPage((current) =>
                Math.min(pageNumbers.at(-1) ?? current, current + 1),
              );
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// Clicking page 2 moves `aria-current="page"` off page 1 and onto page 2.
export const NavigatesPages: Story = {
  render: () => <InteractivePagination />,
  play: async ({ canvas }) => {
    const pageOne = canvas.getByRole("link", { name: "1" });
    const pageTwo = canvas.getByRole("link", { name: "2" });

    await expect(pageOne).toHaveAttribute("aria-current", "page");
    await expect(pageTwo).not.toHaveAttribute("aria-current");

    await userEvent.click(pageTwo);

    await expect(pageTwo).toHaveAttribute("aria-current", "page");
    await expect(pageOne).not.toHaveAttribute("aria-current");
  },
};
