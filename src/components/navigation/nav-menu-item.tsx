import Link from "next/link";
import { cn } from "@/css/lib";
import { NavSwap } from "@/features/reflection";
import { Wave } from "../text";
import type { NavItem } from "./nav-items";

export const NavMenuItem: React.FC<{ navItem: NavItem }> = ({ navItem }) => {
  return (
    <Link
      href={navItem.href}
      className={cn(
        "group/asdf cursor-pointer text-primary/80 text-sm ease-out focus-within:text-foreground-high-contrast hover:text-foreground-high-contrast focus:text-foreground-high-contrast focus-visible:text-foreground-high-contrast data-highlighted:text-foreground-high-contrast",
        navItem.private
          ? "blur-[3px] hue-rotate-360 transition-all hover:blur-[0px] hover:hue-rotate-0"
          : "transition-colors",
        // Literally just to silence dumb tailwind intellisense warning if placed in above ternary
        {
          "duration-1000": navItem.private,
          "duration-300": !navItem.private,
        },
      )}
    >
      {navItem.title === "reflection" ? (
        <NavSwap className="group-hover/asdf:animate-pulse" />
      ) : (
        <navItem.icon className="size-4" />
      )}
      <span>
        {navItem.private ? (
          <Wave
            text={navItem.title}
            animateOnHover
            className="group-hover/asdf:animate-wave-travel"
          />
        ) : (
          navItem.title
        )}
      </span>
    </Link>
  );
};
