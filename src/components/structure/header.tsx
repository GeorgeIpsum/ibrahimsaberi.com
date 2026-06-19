import { WavesArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/atoms/menu";
import { cn } from "@/css/lib";
import { NavSwap } from "@/services/reflection/components/nav-swap";
import { SpotifyIndicator } from "@/services/spotify/spotify-indicator";
import { MobileMenu } from "../navigation/mobile-menu";
import { type NavItem, navItems } from "../navigation/nav-items";
import { Wave } from "../text";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-2 z-100 h-12 w-full bg-background/5 px-1 md:px-0">
      <div className="header-blur relative flex w-full items-center overflow-clip overscroll-none rounded-xl p-2">
        <div className="z-10 flex items-center gap-2">
          <Link rel="home" href="/">
            <Image
              className="size-7"
              loading="eager"
              src="/is.svg"
              alt="Logo"
              width={28}
              height={28}
            />
          </Link>
          <Link rel="home" href="/" tabIndex={-1}>
            <span className="group/title text-sm leading-none tracking-tighter">
              <span className="leading-none opacity-75 duration-500 ease-in-out group-hover/title:opacity-40">
                {Array.from("a whisper.").map((ch, i) => (
                  <span
                    key={ch + i.toString()}
                    className="origin-center leading-none group-hover/title:animate-whisper-travel"
                    style={
                      {
                        animationDelay: `${-40 + i * 50 - Math.exp((i + 1) / 5)}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {ch}
                  </span>
                ))}
              </span>{" "}
              <span className="inline-block whitespace-pre">
                <Wave
                  text="a wave."
                  animateOnHover
                  className="group-hover/title:animate-wave-travel"
                />
              </span>
            </span>
          </Link>
        </div>
        <div className="z-10 flex w-full flex-1 items-center justify-end gap-4 sm:gap-6">
          <nav className="hidden w-full flex-1 items-center justify-end gap-4 sm:flex">
            <ul className="flex w-full items-center justify-end gap-4 text-sm">
              {navItems
                .filter((item: NavItem) => !item.mobileOnly && !item.footerItem)
                .map((item: NavItem) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "text-primary/80 transition-colors duration-300 ease-out hover:text-foreground-high-contrast",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
            </ul>
            <Menu>
              <MenuTrigger
                openOnHover
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="transition-all hover:text-foreground-high-contrast"
                  />
                }
              >
                <WavesArrowDown aria-label="Menu Dropdown" />
              </MenuTrigger>
              <MenuPopup side="bottom" align="end">
                {navItems
                  .filter(
                    (item: NavItem) =>
                      item.mobileOnly &&
                      !item.footerItem &&
                      item.title !== "hearth",
                  )
                  .map((item: NavItem) => (
                    <MenuLinkItem
                      key={item.href}
                      closeOnClick
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            "group/asdf cursor-pointer text-primary/80 text-sm ease-out focus-within:text-foreground-high-contrast hover:text-foreground-high-contrast focus:text-foreground-high-contrast focus-visible:text-foreground-high-contrast data-highlighted:text-foreground-high-contrast",
                            item.private
                              ? "blur-[3px] hue-rotate-360 transition-all hover:blur-[0px] hover:hue-rotate-0"
                              : "transition-colors",
                            // Literally just to silence dumb tailwind intellisense warning if placed in above ternary
                            {
                              "duration-1000": item.private,
                              "duration-300": !item.private,
                            },
                          )}
                        />
                      }
                    >
                      {item.title === "reflection" ? (
                        <NavSwap className="group-hover/asdf:animate-pulse" />
                      ) : (
                        <item.icon className="size-4" />
                      )}
                      <span>
                        {item.private ? (
                          <Wave
                            text={item.title}
                            animateOnHover
                            className="group-hover/asdf:animate-wave-travel"
                          />
                        ) : (
                          item.title
                        )}
                      </span>
                    </MenuLinkItem>
                  ))}
              </MenuPopup>
            </Menu>
          </nav>
          <SpotifyIndicator />
          <div className="inline-block sm:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
