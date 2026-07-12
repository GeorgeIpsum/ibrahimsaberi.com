import Image from "next/image";
import Link from "next/link";
import { SpotifyIndicator } from "@/services/spotify/spotify-indicator";
import { MobileNavMenu } from "../navigation/mobile-nav-menu";
import { NavMenu } from "../navigation/nav-menu";
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
          <NavMenu />
          <SpotifyIndicator />
          <div className="inline-block sm:hidden">
            <MobileNavMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
