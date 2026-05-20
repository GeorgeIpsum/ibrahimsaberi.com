import "server-only";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/atoms/preview-card";
import { AudioWaveform } from "@/components/icons/audio-waveform";
import { cn } from "@/css/lib";
import { getNowPlayingSSR, Listening } from "./listening";

/**
 * Static placeholder that matches the resting state of the live indicator —
 * same dimensions, same shape, same muted colors. Renders before the Spotify
 * fetch resolves so the header doesn't reflow when the live component swaps in.
 */
function SpotifyIndicatorFallback() {
  return (
    <div
      className={cn(
        "isolate rounded-full border bg-background/80 p-1",
        "border-accent text-muted-foreground",
      )}
    >
      <AudioWaveform size={16} playing={false} />
    </div>
  );
}

async function SpotifyIndicatorInner() {
  // Defer to request time — getAccessToken uses Date.now() for token TTL,
  // which Cache Components disallows in the static prerender path.
  await connection();
  const nowPlaying = (await getNowPlayingSSR())?.isPlaying;

  return (
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
  );
}

export function SpotifyIndicator() {
  return (
    <Suspense fallback={<SpotifyIndicatorFallback />}>
      <SpotifyIndicatorInner />
    </Suspense>
  );
}
