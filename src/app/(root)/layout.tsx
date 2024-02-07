import Link from "next/link";

import { Container } from "@/components/atoms";
import { Footer } from "@/components/structure";
import { Worse } from "@/components/svg";
import ThemeToggleSsr from "@/features/theme/ThemeToggleSsr";

const headerLinks = [
  {
    href: "/basin",
    display: "Basin",
    title: "a cloudy surface",
  },
  {
    href: "/projects",
    display: "Projects",
    title: "knick knacks really",
  },
  {
    href: "/cha",
    display: "Chai Room",
    title: ":3",
  },
];

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <header className="mx-2 mt-6 sm:mx-6 sm:mt-8">
        <div className="mx-4 flex text-rose-950 dark:text-teal-100">
          <Container className="relative w-full items-center justify-between gap-4 font-head sm:flex sm:w-auto">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-medium sm:text-4xl"
              title="with feeling"
            >
              <Worse size={40} />
              Once More
            </Link>
            <div className="mt-2 flex flex-row flex-wrap items-center gap-5 sm:mx-4 sm:mt-0">
              {headerLinks.map(({ href, display, title }) => (
                <Link
                  className="block font-mono lowercase"
                  key={display}
                  href={href}
                  title={title}
                >
                  {display}
                </Link>
              ))}
            </div>
            <div className="absolute right-3 top-0 flex h-full items-center sm:relative sm:right-auto sm:top-auto">
              <ThemeToggleSsr />
            </div>
          </Container>
        </div>
      </header>
      <main className="mx-6 w-full lg:max-w-5xl">{children}</main>
      <Footer />
    </>
  );
}
