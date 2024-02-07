import * as NLink from "next/link";
import type { LinkProps } from "next/link";

const NextLink = NLink.default;

const Link: React.FC<React.PropsWithChildren<LinkProps>> = ({ ...props }) => {
  return (
    <NextLink
      className="font-semibold italic text-rose-800 dark:text-teal-200/90"
      {...props}
    />
  );
};

export default Link;
