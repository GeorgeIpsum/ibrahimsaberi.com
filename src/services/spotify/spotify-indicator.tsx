import "server-only";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { AudioWaveform } from "@/components/icons/audio-waveform";
import { cn } from "@/css/lib";
import { getNowPlayingSSR, Listening } from "./listening";

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

const SpotifyIndicatorInner: React.FC = async () => {
  await connection();
  const nowPlaying = (await getNowPlayingSSR())?.isPlaying;

  return (
    <div
      className={cn(
        "isolate flex size-8 items-center justify-center rounded-full border bg-background/80 transition-colors duration-1000 ease-out",
        {
          "border-accent text-muted-foreground": !nowPlaying,
          "border-primary/90 text-primary/90": nowPlaying,
        },
      )}
    >
      <Popover>
        <PopoverTrigger
          className="flex size-8 items-center justify-center rounded-full"
          openOnHover
          delay={300}
        >
          <AudioWaveform size={18} playing={!!nowPlaying} />
        </PopoverTrigger>
        <PopoverContent
          className="w-80 bg-background/75 backdrop-blur"
          align="end"
          sideOffset={12}
        >
          <Listening />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const SpotifyIndicator: React.FC = () => {
  return (
    <Suspense fallback={<SpotifyIndicatorFallback />}>
      <SpotifyIndicatorInner />
    </Suspense>
  );
};
