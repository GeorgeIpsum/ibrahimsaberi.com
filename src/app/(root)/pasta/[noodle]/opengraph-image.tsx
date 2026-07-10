// this is so jank
import { ligatureSquare } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";
import { copypasta } from "@/features/pasta";

export const alt = "pasta";

export { size };

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ noodle: string }>;
}) {
  let { noodle } = await params;
  const isAscii = noodle.startsWith("ASCII");

  let pasta: string | null = null;
  let fontSize = 12;
  if (isAscii) {
    pasta = copypasta.find((p) => p.title === `${noodle}.txt`)?.content ?? null;
    if (pasta) {
      const lines = pasta.split("\n");
      if (lines.length > 100) {
        fontSize = 4;
      } else if (lines.length > 50) {
        fontSize = 6;
      }
    }
    noodle = noodle.replace(/^ASCII/, "");
  }

  return createOgImage({
    title: noodle.replace(/[-_]/g, " "),
    subtitle: pasta ? (
      <div
        style={{
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          lineHeight: 1.1,
          fontSize,
          color: "#FFF",
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          padding: 8,
          borderRadius: 8,
        }}
      >
        {pasta.slice(0, 3000)}
      </div>
    ) : (
      "fresh out the pot"
    ),
    icon: ligatureSquare,
  });
}
