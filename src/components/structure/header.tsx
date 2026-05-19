import Image from "next/image";
import Link from "next/link";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/atoms/preview-card";
import { AudioWaveform } from "@/components/icons/audio-waveform";
import { RefreshTicker } from "@/components/navigation/refresh-ticker";
import { cn } from "@/css/lib";
import { getNowPlayingSSR, Listening } from "@/services/spotify/listening";
import { MobileMenu } from "../navigation/mobile-menu";
import { navItems } from "../navigation/nav-items";

export const Header: React.FC = async () => {
  const nowPlaying = (await getNowPlayingSSR())?.isPlaying;

  return (
    <header className="sticky top-2 z-100 h-12 w-full">
      <RefreshTicker intervalMs={15000} />
      <div className="flex w-full items-center rounded-xl border-accent/25 border-b-2 bg-white/40 p-2 backdrop-blur dark:bg-black/40">
        <div className="flex items-center gap-2">
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
          <Link rel="home" href="/">
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
        <div className="flex w-full flex-1 items-center justify-end gap-4 sm:gap-6">
          <nav className="hidden w-full flex-1 items-center justify-end sm:flex">
            <ul className="flex w-full items-center justify-end gap-4 text-sm">
              {navItems
                .filter((item) => !item.mobileOnly)
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-primary">
                      {item.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <div
            className={cn(
              "isolate rounded-full border bg-background/80 p-1 transition-colors duration-1000 ease-out",
              {
                "border-accent text-muted-foreground": !nowPlaying,
                "border-primary/90 text-primary/90": nowPlaying,
              },
            )}
          >
            <PreviewCard>
              <PreviewCardTrigger delay={300}>
                <AudioWaveform size={16} playing={!!nowPlaying} />
              </PreviewCardTrigger>
              <PreviewCardPopup
                className="w-80 bg-background/75 backdrop-blur"
                align="end"
                sideOffset={12}
              >
                <Listening />
              </PreviewCardPopup>
            </PreviewCard>
          </div>
          <div className="inline-block sm:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
