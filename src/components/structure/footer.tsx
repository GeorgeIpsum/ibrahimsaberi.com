import { SiGithub } from "@icons-pack/react-simple-icons";
import { Rss } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Separator } from "@/components/atoms/separator";
import { ThemeButton } from "@/theme/theme-button";
import { LinkedIn } from "../icons/linkedin";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full">
      <Separator orientation="horizontal" />
      <div className="flex w-full items-center gap-4 px-2 py-4 text-muted-foreground text-sm transition-colors md:px-0">
        <div className="flex flex-1 items-center gap-4">
          <ThemeButton side="top" align="start" />
          <Link href="/about" className="hover:text-primary">
            about
          </Link>
          <Link href="/contact" className="hover:text-primary">
            contact
          </Link>
        </div>
        <div className="grid grid-cols-3 grid-rows-1 items-center justify-center gap-6 sm:gap-4">
          <Link href="/feed.xml" className="hover:text-primary">
            <Rss className="size-5 md:size-4" />
          </Link>
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
