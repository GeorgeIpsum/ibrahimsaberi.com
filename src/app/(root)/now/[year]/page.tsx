import type { Metadata } from "next";
import { PageTitle } from "@/components/structure/title";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return (
    <PageTitle>
      {`/then/`}
      <span className="font-bold font-mono">{year}</span>
    </PageTitle>
  );
}

export const generateStaticParams = async () => {
  const currentYear = new Date().getFullYear();
  const earliestYear = 2018;
  const years = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, i) => earliestYear + i,
  );
  return years.map((year) => ({ year: year.toString() }));
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
