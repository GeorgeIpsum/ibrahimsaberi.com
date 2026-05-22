import Image from "next/image";
import Link from "next/link";
import { RefreshTicker } from "@/components/navigation/refresh-ticker";
import { cn } from "@/css/lib";
import { SpotifyIndicator } from "@/services/spotify/spotify-indicator";
import { MobileMenu } from "../navigation/mobile-menu";
import { navItems } from "../navigation/nav-items";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-2 z-100 h-12 w-full bg-background/5 px-1 md:px-0">
      <RefreshTicker intervalMs={15000} />
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
                a whisper.
              </span>{" "}
              <span className="inline-block whitespace-pre">
                {Array.from("a wave").map((ch, i) => (
                  <span
                    key={ch + i.toString()}
                    className="inline-block origin-bottom leading-none group-hover/title:animate-wave-travel"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    {ch}
                  </span>
                ))}
                .
              </span>
            </span>
          </Link>
        </div>
        <div className="z-10 flex w-full flex-1 items-center justify-end gap-4 sm:gap-6">
          <nav className="hidden w-full flex-1 items-center justify-end sm:flex">
            <ul className="flex w-full items-center justify-end gap-4 text-sm">
              {navItems
                .filter((item) => !item.mobileOnly)
                .map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "text-primary/80 transition-colors duration-300 ease-out hover:text-primary",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
            </ul>
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
