"use client";

import { Music, Pause, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue,
} from "@/components/atoms/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import type { NowPlaying } from "./now-playing";

/** A now-playing snapshot plus the client clock reading when it arrived. */
export type LiveNowPlaying = NowPlaying & { receivedAt: number };

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const TrackProgress: React.FC<{ nowPlaying: LiveNowPlaying }> = ({
  nowPlaying,
}) => {
  const { progressMs, durationMs, isPlaying, receivedAt } = nowPlaying;
  const [now, setNow] = useState(() => performance.now());

  // Tick once per second; the indicator's 1s linear transition interpolates
  // between ticks. Position derives from the clock (not an accumulator), so
  // throttled or missed ticks can't drift it.
  useEffect(() => {
    if (!isPlaying) return;
    setNow(performance.now());
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  const elapsed = isPlaying ? Math.max(0, now - receivedAt) : 0;
  const liveMs = Math.min(progressMs + elapsed, durationMs);

  return (
    <Progress
      value={liveMs}
      max={durationMs}
      aria-label="Track progress"
      className="mt-1 w-full gap-1 pr-3"
    >
      <ProgressValue
        render={<code />}
        className="self-start text-[10px] text-muted-foreground"
      >
        {(_, value) => `${formatTime(value ?? 0)}/${formatTime(durationMs)}`}
      </ProgressValue>
      <ProgressTrack className="h-1">
        <ProgressIndicator className="duration-1000 ease-linear" />
      </ProgressTrack>
    </Progress>
  );
};

export const Listening: React.FC<{ nowPlaying: LiveNowPlaying | null }> = ({
  nowPlaying,
}) => {
  if (!nowPlaying) {
    return (
      <div className="w-full text-center text-muted-foreground text-sm">
        Not listening to anything right now.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex w-78 flex-col gap-2">
        <div className="flex h-16 items-center gap-3">
          {nowPlaying.albumArt ? (
            <div className="relative flex size-16 items-center justify-center rounded">
              <Image
                src={nowPlaying.albumArt}
                alt={nowPlaying.title}
                width={128}
                height={128}
                className="size-16 rounded"
                loading="lazy"
              />
              {!nowPlaying.isPlaying && (
                <div className="absolute inset-0 flex size-16 items-center justify-center rounded bg-primary/10 backdrop-blur">
                  <Pause size={24} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center bg-background/50">
              <Music size={36} />
            </div>
          )}
          <div className="flex w-54 flex-col gap-1 overflow-hidden leading-none">
            <div className="line-clamp-1 flex w-full items-center justify-between gap-2">
              <div
                title={nowPlaying.title}
                className="flex-1 font-medium text-sm"
              >
                {nowPlaying.title}
              </div>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      className="pr-3 text-[10px] text-muted-foreground"
                      href={nowPlaying.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <Volume2 className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="right">Listen on Spotify</TooltipContent>
              </Tooltip>
            </div>
            <div
              title={nowPlaying.artist}
              className="line-clamp-2 text-muted-foreground text-xs leading-none"
            >
              {nowPlaying.artist}
            </div>
            {/* Keyed by track so a song change snaps instead of gliding backwards. */}
            <TrackProgress key={nowPlaying.url} nowPlaying={nowPlaying} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
