import Link from "next/link";
import { cn } from "@/css/lib";
import type { NavItem } from "./nav-items";

export const NavHeaderItem: React.FC<{ navItem: NavItem }> = ({ navItem }) => {
  return (
    <Link
      href={navItem.href}
      className={cn(
        "text-primary/80 transition-colors duration-300 ease-out hover:text-foreground-high-contrast",
      )}
    >
      {navItem.title}
    </Link>
  );
};
