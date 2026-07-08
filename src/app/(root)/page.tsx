import { ChevronsRight } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { Title } from "@/components/structure/title";
import { CurvedText } from "@/components/text";
import { listRipples } from "@/features/basin/ripples";

const ASCII_ART = `
⠀⠀⠀⠀⠀⠀⠀⣀⣤⡴⠶⠿⠛⢏⡿⠖⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⡴⣞⠯⠉⠈⠀⣠⡶⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣴⠟⠙⠈⣎⡹⠂⣴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⣯⡟⢚⣀⠀⠀⠀⡰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⡿⡃⢋⣌⠂⠈⠆⡠⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣸⢿⠎⢰⡈⠀⠈⠀⣹⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣸⣿⡄⠷⣠⠀⠀⠀⡸⡗⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢹⣾⣿⣷⣛⠀⠀⠀⣜⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠸⣿⢻⣏⠸⡃⠀⠀⠈⢹⢧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢻⣿⡮⣠⣗⠒⠤⠀⠀⠹⣳⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣼⢿⣗⣧⣦⢤⠇⢀⣤⣄⠙⣿⡦⣄⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠄
⠀⠀⠈⠛⢏⣷⣶⣜⣤⣈⠂⠜⠀⢀⣀⡉⡭⠯⠖⠲⠒⢶⢖⣯⠟⠁⠀
⠀⠀⠀⠀⠀⠙⠻⣿⣿⣷⣷⣯⣔⡿⣃⠦⡵⣠⠠⢤⣤⠿⠋⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠓⠿⠽⣷⣿⣾⡿⠞⠛⠉⠀⠀⠀⠀⠀⠀⠀`;

export default async function Page() {
  const ripples = await listRipples({ take: 5 });

  return (
    <div className="mb-4 flex flex-col gap-4 text-sm">
      <div className="relative -mx-4 overflow-hidden rounded-2xl">
        <div className="mx-4">
          <Title
            className="text-2xl"
            art={{
              ascii: ASCII_ART,
              anchor: "bottom-right",
              offset: { x: -12, y: 2 },
              color: "#F8C523",
            }}
          >
            Ibrahim Saberi{" "}
            <span className="text-muted-foreground text-sm">presents</span>
          </Title>
        </div>
      </div>
      <section>
        <h2 className="mb-4 text-xl">A Website</h2>
        <p className="mb-4">
          I love building things. I firmly believe yak-shaving exists at the
          center of all real innovation. I think prototyping is an essential and
          probably lost art. This entire website is really just 20 prototypes
          embedded in 400 yak-shavings.
        </p>
        <p className="mb-2">
          I <span className="italic">absolutely detest</span> building things.
        </p>
      </section>
      <section className="w-full overflow-x-hidden">
        <Link href="/basin" className="hover:text-foreground-high-contrast">
          <h2 className="text-xl">A Basin</h2>
        </Link>
        <ScrollArea className="py-2" scrollFade scrollbarGutter>
          <div className="flex w-fit gap-3">
            {ripples.map((ripple) => (
              <ItemContainer key={ripple.slug}>
                <Link href={`/basin/${ripple.slug}`}>
                  <h3
                    className="line-clamp-1 text-base transition-colors hover:text-foreground-high-contrast"
                    title={`${ripple.frontmatter.title}\n\n${ripple.frontmatter.blurb}`}
                  >
                    {ripple.frontmatter.title}
                  </h3>
                </Link>
                <time
                  dateTime={ripple.frontmatter.publishedAt}
                  className="text-muted-foreground text-xs"
                >
                  {new Date(ripple.frontmatter.publishedAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </time>
                <p className="mt-2 line-clamp-3 text-xs md:line-clamp-4">
                  {ripple.frontmatter.blurb}
                </p>
              </ItemContainer>
            ))}
            <More text="read more" href="/basin" />
          </div>
        </ScrollArea>
      </section>
      <section>
        <Link href="/reservoir" className="hover:text-foreground-high-contrast">
          <h2 className="text-xl">A Reservoir</h2>
        </Link>
        <ScrollArea className="py-2" scrollFade scrollbarGutter>
          <div className="flex w-fit gap-3">
            {repos.map((repo) => (
              <ItemContainer key={repo.name}>
                <Link
                  href={repo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h3
                    className="line-clamp-1 font-mono font-thin text-sm transition-colors hover:text-foreground-high-contrast"
                    title={`${repo.description}\n\n${repo.sub}`}
                  >
                    {repo.name}
                  </h3>
                </Link>
                <p className="mt-2 font-mono text-xs">{repo.description}</p>
              </ItemContainer>
            ))}
            <More text="more repos" href="/reservoir" />
          </div>
        </ScrollArea>
      </section>
      <section>
        <Link href="/hsab" className="hover:text-foreground-high-contrast">
          <h2 className="text-xl">A Sandbox</h2>
        </Link>
        Coming Soon™
      </section>
      <section>
        <Link href="/fm" className="hover:text-foreground-high-contrast">
          <h2 className="text-xl">A Station</h2>
        </Link>
        Also Coming Soon™
      </section>
      <section>
        <h2 className="text-xl">A Whisper. A Wave.</h2>
        More on this later I promise
      </section>
    </div>
  );
}

const ItemContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div
    className="gradient-border relative h-30 w-52 rounded-lg bg-card px-3 pt-2 pb-1 md:w-64"
    style={
      {
        "--gradient-border-background":
          "linear-gradient(300deg, transparent, var(--border)",
      } as React.CSSProperties
    }
  >
    {children}
  </div>
);

const More: React.FC<{ text: string; href: string }> = ({ text, href }) => (
  <div className="flex items-center justify-center">
    <Link
      href={href}
      className="relative flex size-12 items-center justify-center font-bold font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground-high-contrast"
    >
      {/* lol. lmao even */}
      <CurvedText
        text={`${text
          .split(" ")
          .map((word) => word.split("").join("  "))
          .join("      ")}     `}
        size={36}
        phase="ring"
        onHover="goBonkers"
      />
      <ChevronsRight className="pointer-events-none absolute size-4" />
    </Link>
  </div>
);

const repos = [
  {
    name: "prisma-json-field-validate",
    href: "https://github.com/GeorgeIpsum/prisma-json-field-validate",
    description:
      "query/insert native standard schema validation for prisma schema JSON fields",
  },
  {
    name: "prisma-arktype",
    href: "https://github.com/GeorgeIpsum/prisma-arktype",
    description: "arktype schema generation for prisma schemas",
  },
  {
    name: "ibrahimsaberi.com",
    href: "https://github.com/GeorgeIpsum/ibrahimsaberi.com",
    description: "YOU ARE HERE 👈",
  },
  {
    name: "next-color-schema",
    href: "https://github.com/GeorgeIpsum/next-color-scheme",
    description: "nextjs SSR-based color scheme detection and management",
    sub: "note: using this requires opting in to always-ish dynamic rendering, so i wouldn't recommend it",
  },
];
