import { Separator } from "@/components/atoms/separator";
import { Title } from "@/components/structure/title";
import { DropletStreamItem } from "@/features/basin/components/droplet-stream-item";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { countDroplets, listDroplets } from "@/features/basin/droplets";
import { DROPLETS_PER_PAGE, makePageInfo } from "@/features/basin/pagination";

const DROP = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⠃⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⡆⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣆⡀⠙⠻⣿⣿⣿⣿⣿⡿⠃⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠶⠶⠶⠾⠿⠛⠋⠀⠀⠀⠀⠀⠀`;

export default async function Page() {
  const [droplets, total] = await Promise.all([
    listDroplets({ take: DROPLETS_PER_PAGE }),
    countDroplets(),
  ]);
  const page = makePageInfo(1, total, DROPLETS_PER_PAGE);

  return (
    <>
      <Title
        containerClassName="group flex w-auto items-center gap-2"
        title="humming whispers"
        art={{
          ascii: DROP.split("\n")
            .map((line) => line.repeat(4))
            .join("\n"),
          anchor: "bottom-left",
          offset: { x: 8, y: 0 },
          opacity: {
            start: 1,
            end: 0,
            direction: "bottom-left-to-top-right",
          },
        }}
      >
        droplets
      </Title>

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
