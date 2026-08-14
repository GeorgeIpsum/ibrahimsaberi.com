import { Separator } from "@/components/atoms/separator";
import { PageTitle } from "@/components/structure/title";
import { DropletStreamItem } from "@/features/basin/components/droplet-stream-item";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { countDroplets, listDroplets } from "@/features/basin/droplets";
import { DROPLETS_PER_PAGE, makePageInfo } from "@/features/basin/pagination";

const DROP = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣧
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣆
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⠃⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⡆⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣆⡀⠙⠻⣿⣿⣿⣿⣿⡿⠃
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠶⠶⠶⠾⠿⠛⠋⠀`;

// commit sha (if exists aka in deployed environment) will be in format like:
// 1d745c8d3a1c531fe785ef7fecdb7750b261ab72
//   length: 40 chars
//   format: hex string
// DROP is 13 lines
// using 39 chars from the commit sha, we average the decimal value of each group of 3 chars to get a number between 0-15, then we use the last char to determine if we add one additional char of padding (>7 -> add 1).
// in dev changing this file just randomizes it idk
const DROP_LENGTH = DROP.split("\n").length;
const COMMIT_SHA =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_PREVIOUS_SHA ??
  Array.from({ length: 40 })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
const GROUPED_SHA = Array.from({ length: DROP_LENGTH }).map((_, i) =>
  COMMIT_SHA.slice(i * 3, i * 3 + 3),
);
const PADDING = parseInt(COMMIT_SHA.slice(-1), 16) > 7 ? 1 : 0;

const average = (...args: number[]) =>
  Math.floor(args.reduce((a, b) => a + b, 0) / args.length);

const CORRUPTION = Array.from({ length: DROP_LENGTH }).map(
  (_, i) =>
    average(...GROUPED_SHA[i].split("").map((c) => parseInt(c, 16))) + PADDING,
);

const DROPS = DROP.split("\n")
  .map((line, i) =>
    (
      "⠛".repeat(Math.max(Math.floor(CORRUPTION[i] / 2), 1)) +
      line +
      "⠶".repeat(Math.max(Math.floor(CORRUPTION[i] / 2), 1))
    ).repeat(6),
  )
  .join("\n");

export default async function Page() {
  const [droplets, total] = await Promise.all([
    listDroplets({ take: DROPLETS_PER_PAGE }),
    countDroplets(),
  ]);
  const page = makePageInfo(1, total, DROPLETS_PER_PAGE);

  return (
    <>
      <PageTitle
        className="px-6"
        title="humming whispers"
        art={{
          ascii: DROPS,
          anchor: "bottom-left",
          offset: { x: -8, y: 0 },
          opacity: {
            start: 1,
            end: 0,
            direction: "bottom-left-to-top-right",
          },
        }}
      >
        droplets
      </PageTitle>

      {droplets.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
      ) : (
        <>
          <section className="space-y-6">
            {droplets.map((droplet) => (
              <DropletStreamItem key={droplet.slug} droplet={droplet} />
            ))}
          </section>
          <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
          <PaginationControls page={page} basePath="/basin/droplets" />
        </>
      )}
    </>
  );
}
