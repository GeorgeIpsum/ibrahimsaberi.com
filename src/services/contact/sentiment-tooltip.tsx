"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { useSentiment } from "@/services/sentiment/use-sentiment";
import { SentimentIcon } from "./sentiment-icon";
import { SentimentText } from "./sentiment-text";

const DISMISS_ANIMATION_MS = 200;

interface SentimentTooltipProps {
  text: string;
  debounceTime?: number;
}

export const SentimentTooltip: React.FC<SentimentTooltipProps> = ({
  text,
  debounceTime,
}) => {
  const { sentiment, sentimentResponse, sentimentSource, loading, dismiss } =
    useSentiment({ text, debounceTime });

  const [open, setOpen] = useState(false);
  const prevSentimentRef = useRef<typeof sentiment>(null);
  const prevSourceRef = useRef<typeof sentimentSource>("static");
  const prevLoadingRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sentimentChanged = sentiment !== prevSentimentRef.current;
    const sourceChanged = sentimentSource !== prevSourceRef.current;
    const loadingSettled = prevLoadingRef.current && !loading;

    prevSentimentRef.current = sentiment;
    prevSourceRef.current = sentimentSource;
    prevLoadingRef.current = loading;

    if (sentiment === null) {
      setOpen(false);
      return;
    }

    if (sourceChanged && sentimentSource === "static") {
      setOpen(false);
      return;
    }

    if (sourceChanged && sentimentSource === "robot") {
      setOpen(true);
      return;
    }

    if (sentimentChanged && !loading) {
      setOpen(true);
      return;
    }

    if (loadingSettled) {
      setOpen(true);
    }
  }, [sentiment, sentimentSource, loading]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    },
    [],
  );

  const onOpenChange = (next: boolean) => {
    if (next) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      setOpen(true);
      return;
    }
    setOpen(false);
    if (sentimentSource === "robot") {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        dismiss();
        dismissTimerRef.current = null;
      }, DISMISS_ANIMATION_MS);
    }
  };

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger>
        <SentimentIcon sentiment={sentiment} loading={loading} />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        align="end"
        className="max-w-xs whitespace-normal"
      >
        <SentimentText
          display={sentimentResponse}
          robot={sentimentSource === "robot"}
        />
      </TooltipContent>
    </Tooltip>
  );
};
