import type { Metadata } from "next";
import { PageTitle } from "@/components/structure/title";
import { cn } from "@/css/lib";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { LibreMap } from "../map";

const locations = {
  2018: [
    [-90.305, 38.6482],
    [-118.131317, 34.190163],
  ], // washu + altadena
  2019: [
    [-118.131317, 34.190163],
    [-84.391037, 33.755],
  ], // altadena + atlanta
  2020: [[-84.391037, 33.755]],
  2021: [[-84.391037, 33.755]],
  2022: [[-84.391037, 33.755]],
  2023: [
    [-84.391037, 33.755],
    [-77.09406090455401, 38.98419034316663],
  ],
  2024: [[-77.09406090455401, 38.98419034316663]],
  2025: [[-77.09406090455401, 38.98419034316663]],
} as const;

const getYears = () => {
  return Object.keys(locations).map((year) => ({ year }));
};

export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;

  const coords = locations[year as keyof typeof locations];

  return (
    <div className="flex w-full flex-col">
      <PageTitle>
        {`/then/`}
        <span className="font-bold font-mono">{year}</span>
      </PageTitle>
      {!!coords && (
        <div className="relative w-full overflow-hidden rounded-b-lg">
          <div className="flex h-fit max-md:flex-col md:h-60">
            {coords.map((set, index) => (
              <div
                key={set.toString() + index.toString()}
                className={cn("w-full", coords.length > 1 && "md:w-1/2")}
              >
                <LibreMap
                  initialCoords={set}
                  rotate={index > 0 ? -6 : undefined}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-background to-20% to-transparent" />
        </div>
      )}
    </div>
  );
}

export const generateStaticParams = async () => {
  return getYears();
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> => {
  const { year } = await params;

  return {
    title: `/then/${year}`,
    description: `what i was doing in ${year}.`,
    openGraph: generateOgMetadata(`/then/${year}`, `/then/${year}`),
  };
};
