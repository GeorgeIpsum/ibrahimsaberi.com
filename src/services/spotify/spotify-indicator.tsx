"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { AudioWaveform } from "@/components/icons/audio-waveform";
import { cn } from "@/css/lib";
import { Listening, type LiveNowPlaying } from "./listening";
import type { NowPlaying } from "./now-playing";

const POLL_INTERVAL_MS = 10_000;

async function fetchNowPlaying(
  noCache = false,
): Promise<LiveNowPlaying | null> {
  try {
    const res = await fetch(
      "/api/spotify/now-playing",
      noCache ? { cache: "no-store" } : undefined,
    );
    if (!res.ok) return null;
    const { track } = (await res.json()) as { track: NowPlaying | null };
    // Anchor the snapshot to the client clock so the progress bar can
    // extrapolate between polls without server/client clock skew.
    return track ? { ...track, receivedAt: performance.now() } : null;
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
  const [nowPlaying, setNowPlaying] = useState<LiveNowPlaying | null>(null);
  const [loaded, setLoaded] = useState(false);
  const trackEndTimeout = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async (noCache = false) => {
    const track = await fetchNowPlaying(noCache);
    setNowPlaying(track);
    setLoaded(true);

    if (track) {
      const timeUntilEnd = track.durationMs - track.progressMs;
      if (trackEndTimeout.current) {
        clearTimeout(trackEndTimeout.current);
      }
      trackEndTimeout.current = setTimeout(() => {
        refresh(true);
      }, timeUntilEnd + 50);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      } else if (document.visibilityState === "hidden") {
        clearInterval(id);
        if (trackEndTimeout.current) {
          clearTimeout(trackEndTimeout.current);
        }
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
      id="spotify-indicator"
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
