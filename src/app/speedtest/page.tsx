import type { Metadata } from "next";
import { Suspense } from "react";
import { decodeResult } from "@/features/speedtest/codec";
import { Speedtest } from "@/features/speedtest/speedtest";

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
    openGraph: {
      images: [
        {
          url: "/og/speedtest.png",
          width: 1200,
          height: 630,
          alt: "speedtest",
        },
      ],
    },
  };
}

async function SpeedtestFromParams({ searchParams }: PageProps) {
  const result = decodeResult(firstParam((await searchParams).result));
  return <Speedtest initialResult={result} />;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={null}>
      <SpeedtestFromParams searchParams={searchParams} />
    </Suspense>
  );
}
