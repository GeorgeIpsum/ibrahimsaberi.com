export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return year;
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
