import "server-only";
import { Music, Pause, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { getNowPlaying } from "./now-playing";

export const getNowPlayingSSR = cache(getNowPlaying);

export const Listening: React.FC = async () => {
  const nowPlaying = await getNowPlayingSSR();

  if (!nowPlaying) {
    return (
      <div className="w-full text-center">
        Not listening to anything right now.
      </div>
    );
  }

  return (
    <div className="flex h-16 w-78 items-center gap-2">
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
            <div className="absolute inset-0 flex size-16 items-center justify-center rounded bg-accent/20 backdrop-blur">
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
        <div title={nowPlaying.title} className="line-clamp-1 leading-none">
          {nowPlaying.title}
        </div>
        <div
          title={nowPlaying.artist}
          className="line-clamp-2 text-muted-foreground text-xs leading-none"
        >
          {nowPlaying.artist}
        </div>
        <Link
          className="mt-1 flex w-full items-center gap-1 text-[10px] text-muted-foreground"
          href={nowPlaying.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Volume2 className="size-3" />
          Listen on Spotify
        </Link>
      </div>
    </div>
  );
};
