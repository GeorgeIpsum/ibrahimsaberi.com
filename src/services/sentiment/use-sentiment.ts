"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { randomArrayMember } from "@/utils/rand";
import { classifySentiment, getSentiment } from "./lib";
import { sentimentStrings } from "./sentiment-strings";
import type { Sentiment } from "./types";

const DEFAULT_DEBOUNCE_MS = 1000;
const COOLDOWN_MS = 60_000;

interface UseSentimentInput {
  text: string;
  debounceTime?: number;
}

interface UseSentimentResult {
  sentiment: Sentiment;
  sentimentResponse: string;
  sentimentSource: "robot" | "static";
  loading: boolean;
  isTruncated: boolean;
  dismiss: () => void;
}

export function useSentiment({
  text,
  debounceTime = DEFAULT_DEBOUNCE_MS,
}: UseSentimentInput): UseSentimentResult {
  const [sentiment, setSentiment] = useState<Sentiment>(null);
  const [randomDisplay, setRandomDisplay] = useState<string | null>(null);
  const [frozenDisplay, setFrozenDisplay] = useState<string | null>(null);
  const [pendingResponse, setPendingResponse] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [loading, setLoading] = useState(false);

  const lastFireAtRef = useRef<number | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);
  const frozenSentimentRef = useRef<Sentiment>(null);
  const pendingResponseRef = useRef(pendingResponse);
  const prevSentimentRef = useRef<Sentiment>(null);
  const prevTextRef = useRef("");

  pendingResponseRef.current = pendingResponse;

  useEffect(() => {
    if (!text.trim()) {
      setSentiment(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      getSentiment(text)
        .then((data) => {
          setSentiment(classifySentiment(data));
        })
        .catch((e) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Error classifying sentiment:", e);
          }
        });
    }, debounceTime);
    return () => clearTimeout(timeoutId);
  }, [text, debounceTime]);

  useEffect(() => {
    const sentimentChanged = sentiment !== prevSentimentRef.current;
    const textChanged = text !== prevTextRef.current;
    prevSentimentRef.current = sentiment;
    prevTextRef.current = text;

    if (!sentimentChanged && !textChanged) return;

    if (sentiment === null) {
      inFlightRef.current?.abort();
      inFlightRef.current = null;
      frozenSentimentRef.current = null;
      setFrozenDisplay(null);
      setPendingResponse(false);
      setLoading(false);
      setRandomDisplay(null);
      return;
    }

    if (pendingResponse) {
      setPendingResponse(false);
      setFrozenDisplay(null);
      frozenSentimentRef.current = null;
      return;
    }

    const isFrozen = frozenSentimentRef.current !== null;
    const categoryChanged =
      isFrozen && sentiment !== frozenSentimentRef.current;

    if (categoryChanged) {
      inFlightRef.current?.abort();
      inFlightRef.current = null;
      frozenSentimentRef.current = null;
      setFrozenDisplay(null);
      setPendingResponse(false);
      setLoading(false);
      setRandomDisplay(randomArrayMember(sentimentStrings[sentiment]));
      return;
    }

    if (isFrozen) return;

    const now = Date.now();
    const inCooldown =
      lastFireAtRef.current !== null &&
      now - lastFireAtRef.current < COOLDOWN_MS;

    if (inCooldown) {
      setRandomDisplay(randomArrayMember(sentimentStrings[sentiment]));
      return;
    }

    const fresh = randomArrayMember(sentimentStrings[sentiment]);
    setRandomDisplay(fresh);
    setFrozenDisplay(fresh);
    frozenSentimentRef.current = sentiment;
    lastFireAtRef.current = now;

    const controller = new AbortController();
    inFlightRef.current = controller;
    setLoading(true);

    fetch("/api/planet-destruction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sentiment }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 429) {
            const errorData = await res.json();
            console.error(
              "Wow. Imagine being rate limited by a planet destruction API. Here's what `Le`Bron James has to say about that:",
              errorData.error,
            );
            return {
              error:
                errorData.error ||
                "Wow. Imagine being rate limited by a planet destruction API.",
            } as { error: string };
          } else if (
            res.headers.get("Content-Type")?.includes("application/json")
          ) {
            const errorData = await res.json();
            console.error("Sentiment LLM API error:", errorData);
            return {
              error:
                errorData.error ||
                "Planet destruction haulted. What did you do.",
            };
          }
          throw new Error(`planet-destruction returned ${res.status}`);
        }
        return (await res.json()) as {
          response: string;
          leTruncated?: boolean;
        };
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if ("error" in data) {
          setFrozenDisplay(data.error);
        } else {
          if (data.leTruncated) {
            setIsTruncated(true);
          } else {
            setIsTruncated(false);
          }
          setFrozenDisplay(data.response);
        }
        setPendingResponse(true);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (process.env.NODE_ENV === "development") {
          console.error("Sentiment LLM error:", err);
        }
        frozenSentimentRef.current = null;
        setFrozenDisplay(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });
  }, [sentiment, text, pendingResponse]);

  useEffect(
    () => () => {
      inFlightRef.current?.abort();
    },
    [],
  );

  const dismiss = useCallback(() => {
    if (!pendingResponseRef.current) return;
    setPendingResponse(false);
    setFrozenDisplay(null);
    frozenSentimentRef.current = null;
  }, []);

  const sentimentResponse = frozenDisplay ?? randomDisplay ?? "";

  return {
    sentiment,
    sentimentResponse,
    isTruncated,
    sentimentSource: pendingResponse ? "robot" : "static",
    loading,
    dismiss,
  };
}
