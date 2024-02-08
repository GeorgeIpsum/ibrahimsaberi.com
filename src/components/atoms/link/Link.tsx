import * as NLink from "next/link";
import { cx } from "class-variance-authority";
import type { LinkProps } from "next/link";

const NextLink = NLink.default;

const Link: React.FC<
  React.PropsWithChildren<LinkProps & { className?: string }>
> = ({ className, ...props }) => {
  return (
    <NextLink
      className={cx(
        "font-semibold italic text-rose-800 dark:text-teal-200/90",
        className
      )}
      {...props}
    />
  );
};

export default Link;
