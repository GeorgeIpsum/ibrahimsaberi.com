"use client";

import { Activity, ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/atoms/frame";
import { Progress } from "@/components/atoms/progress";
import { Spinner } from "@/components/atoms/spinner";
import { cn } from "@/css/lib";
import { encodeResult, type SpeedtestResult } from "./codec";
import { type SpeedtestState, useSpeedtest } from "./use-speedtest";
import { describeVercelRegion } from "./vercel-region";

const PHASE_LABEL: Record<"ping" | "down" | "up" | "settle", string> = {
  ping: "measuring latency",
  down: "measuring download",
  up: "measuring upload",
  settle: "double-checking latency",
};

/** "Toronto, ON, CA → Frankfurt (fra1)", degrading to whichever end is known. */
const routeLabel = ({
  location,
  region,
}: {
  location: string | null;
  region: string | null;
}): string | null => {
  const via = region ? describeVercelRegion(region) : null;
  if (location && via) return `${location} → ${via}`;
  if (via) return `via ${via}`;
  if (location) return `from ${location}`;
  return null;
};

interface SpeedtestProps {
  /** Decoded `?result=` param when landing on a shared link, else null. */
  initialResult: SpeedtestResult | null;
}

export const Speedtest: React.FC<SpeedtestProps> = ({ initialResult }) => {
  const [result, setResult] = useState<SpeedtestResult | null>(initialResult);

  const onComplete = useCallback((next: SpeedtestResult) => {
    setResult(next);
    // Shallow URL update: makes the finished run shareable without a server
    // round trip (the result is already on screen).
    window.history.replaceState(null, "", `?result=${encodeResult(next)}`);
  }, []);

  const { state, start } = useSpeedtest({ onComplete });

  const runAgain = useCallback(() => {
    window.history.replaceState(null, "", "/speedtest");
    setResult(null);
    start();
  }, [start]);

  if (result) {
    return <ResultCard result={result} onRunAgain={runAgain} />;
  }
  return <MeasureFrame state={state} onStart={start} />;
};

function MeasureFrame({
  state,
  onStart,
}: {
  state: SpeedtestState;
  onStart: () => void;
}) {
  const runningPhase =
    state.phase === "ping" ||
    state.phase === "down" ||
    state.phase === "up" ||
    state.phase === "settle"
      ? state.phase
      : null;

  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Speed test</FrameTitle>
        <FrameDescription>
          {state.location && state.region
            ? `Between ${state.location} and ${describeVercelRegion(state.region)}.`
            : state.region
              ? `Between you and ${describeVercelRegion(state.region)}.`
              : "Between you and this site."}
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-5">
        {state.phase === "error" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-muted-foreground text-sm">
              Something went sideways mid-measurement.
            </p>
            <Button onClick={onStart}>Retry</Button>
          </div>
        ) : runningPhase !== null ? (
          <>
            <div className="flex flex-col items-center gap-1 py-2">
              <div className="flex h-10 items-center font-mono text-4xl tabular-nums">
                {state.liveMbps !== null ? (
                  state.liveMbps.toFixed(1)
                ) : (
                  <Spinner className="size-6" />
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                {state.liveMbps !== null
                  ? `Mbps · ${PHASE_LABEL[runningPhase]}`
                  : PHASE_LABEL[runningPhase]}
              </div>
            </div>
            <Progress value={Math.round(state.progress * 100)} />
            <dl className="grid grid-cols-3 gap-1">
              <Metric
                label="ping"
                value={state.pingMs !== null ? `${state.pingMs} ms` : null}
                active={state.phase === "ping" || state.phase === "settle"}
              />
              <Metric
                label="down"
                value={
                  state.downMbps !== null ? `${state.downMbps} Mbps` : null
                }
                active={state.phase === "down"}
              />
              <Metric
                label="up"
                value={state.upMbps !== null ? `${state.upMbps} Mbps` : null}
                active={state.phase === "up"}
              />
            </dl>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-muted-foreground text-sm">
              Pings, then pulls, then pushes. Takes ten-ish seconds.
            </p>
            <Button onClick={onStart}>Start test</Button>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}

function Metric({
  label,
  value,
  active,
}: {
  label: string;
  value: string | null;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg py-2",
        active && "bg-muted",
      )}
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium text-sm tabular-nums">{value ?? "—"}</dd>
    </div>
  );
}

function ResultCard({
  result,
  onRunAgain,
}: {
  result: SpeedtestResult;
  onRunAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}/speedtest?result=${encodeResult(result)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Speed test</CardTitle>
        {/* Locale/timezone formatting differs between the SSR pass (shared
            links) and the client, so the mismatch is expected. */}
        <CardDescription suppressHydrationWarning>
          {new Date(result.measuredAt).toLocaleString()}
          {routeLabel(result) ? ` · ${routeLabel(result)}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <ResultMetric
            icon={<ArrowDown aria-hidden className="size-3.5" />}
            label="Download"
            value={result.downMbps}
            unit="Mbps"
          />
          <ResultMetric
            icon={<ArrowUp aria-hidden className="size-3.5" />}
            label="Upload"
            value={result.upMbps}
            unit="Mbps"
          />
          <ResultMetric
            icon={<Activity aria-hidden className="size-3.5" />}
            label="Ping"
            value={result.pingMs}
            unit="ms"
          />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={onRunAgain}>Run again</Button>
        <Button variant="outline" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResultMetric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-2 py-4">
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="font-mono text-2xl tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{unit}</div>
    </div>
  );
}
