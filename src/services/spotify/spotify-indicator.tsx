"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { AudioWaveform } from "@/components/icons/audio-waveform";
import { cn } from "@/css/lib";
import { Listening } from "./listening";
import type { NowPlaying } from "./now-playing";

const POLL_INTERVAL_MS = 15_000;

async function fetchNowPlaying(): Promise<NowPlaying | null> {
  try {
    const res = await fetch("/api/spotify/now-playing");
    if (!res.ok) return null;
    const { track } = (await res.json()) as { track: NowPlaying | null };
    return track;
  } catch {
    return null;
  }
}

const SpotifyIndicatorFallback: React.FC = () => {
  return (
    <div
      className={cn(
        "isolate flex size-8 items-center justify-center rounded-full border bg-background/80",
        "border-accent text-muted-foreground",
      )}
    >
      <AudioWaveform size={18} playing={false} />
    </div>
  );
};

export const SpotifyIndicator: React.FC = () => {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const track = await fetchNowPlaying();
    setNowPlaying(track);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      } else if (document.visibilityState === "hidden") {
        clearInterval(id);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  if (!loaded) return <SpotifyIndicatorFallback />;

  const isPlaying = !!nowPlaying?.isPlaying;

  return (
    <div
      className={cn(
        "isolate flex size-8 items-center justify-center rounded-full border bg-background/80 transition-colors duration-1000 ease-out",
        {
          "border-accent text-muted-foreground": !isPlaying,
          "border-primary/90 text-primary/90": isPlaying,
        },
      )}
    >
      <Popover>
        <PopoverTrigger
          className="spotify-indicator flex size-8 items-center justify-center rounded-full"
          openOnHover
          delay={300}
          autoFocus
        >
          <AudioWaveform size={18} playing={isPlaying} />
        </PopoverTrigger>
        <PopoverContent
          className="w-80 bg-background/75 backdrop-blur"
          align="end"
          sideOffset={12}
        >
          <Listening nowPlaying={nowPlaying} />
        </PopoverContent>
      </Popover>
    </div>
  );
};
