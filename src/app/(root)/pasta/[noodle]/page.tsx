import type { Metadata } from "next";
import { allSauce } from "@/features/pasta";
import { PastaPlate } from "@/features/pasta/components/plate";

type Props = {
  params: Promise<{ noodle: string }>;
};

// Old ?noodle= links arrive percent-encoded; malformed encodings just fall
// through to the invalid-pasta state instead of throwing.
const toNoodle = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export function generateStaticParams() {
  return allSauce.map((noodle) => ({ noodle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { noodle } = await params;
  return { title: toNoodle(noodle).replace(/[-_]/g, " ") };
}

export default async function Page({ params }: Props) {
  const { noodle } = await params;
  return <PastaPlate noodle={toNoodle(noodle)} />;
}
