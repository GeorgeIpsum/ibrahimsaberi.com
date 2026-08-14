import { SiGithub } from "@icons-pack/react-simple-icons";
import { Rss } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Separator } from "@/components/atoms/separator";
import { ThemeButton } from "@/features/theme";
import { LinkedIn } from "../icons/linkedin";
import { type NavItem, navItems } from "../navigation/nav-items";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full px-2 md:px-0">
      <Separator orientation="horizontal" />
      <div className="flex w-full items-center gap-4 px-2 py-4 text-muted-foreground text-sm transition-colors md:px-0">
        <div className="flex flex-1 items-center gap-4">
          <ThemeButton side="top" align="start" />
          {navItems
            .filter((item) => (item as NavItem).footerItem)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-primary"
              >
                {item.title}
              </Link>
            ))}
        </div>
        <div className="grid grid-cols-3 grid-rows-1 items-center justify-center gap-6 sm:gap-4">
          <a href="/feed.xml" className="hover:text-primary">
            <Rss className="size-5 md:size-4" />
          </a>
          <Link
            href="https://www.linkedin.com/in/ibrahimsaberi/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <LinkedIn className="size-5 md:size-4" />
          </Link>
          <Link
            className="hover:text-primary"
            href="https://github.com/GeorgeIpsum"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiGithub className="size-5 md:size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
};
