import type { Metadata } from "next";
import { Suspense } from "react";
import { decodeResult } from "@/features/speedtest/codec";
import { Speedtest } from "@/features/speedtest/speedtest";

// SSR shell: reading searchParams keeps the route dynamic, and a shared
// `?result=` link renders the result card fully on the server. The client
// only takes over for the measurement itself. The searchParams await lives in
// a Suspense-wrapped child so the static shell can stream immediately.

interface PageProps {
  searchParams: Promise<{ result?: string | string[] }>;
}

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const result = decodeResult(firstParam((await searchParams).result));
  return {
    title: "speedtest",
    description: result
      ? `↓ ${result.downMbps} Mbps · ↑ ${result.upMbps} Mbps · ${result.pingMs} ms ping`
      : "How fast does the water flow between you and this site?",
  };
}

async function SpeedtestFromParams({ searchParams }: PageProps) {
  const result = decodeResult(firstParam((await searchParams).result));
  return <Speedtest initialResult={result} />;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <SpeedtestFromParams searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
