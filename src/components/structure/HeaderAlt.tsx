import Link from "next/link";

import ThemeToggleSsr from "@/features/theme/ThemeToggleSsr";

import { Container } from "../atoms";
import { Logo } from "../navigation";

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
    display: "Chai",
    title: ":3",
  },
];

const HeaderAlt: React.FC = () => {
  return (
    <header className="sticky top-0 mx-2 mt-6 sm:mx-6 sm:mt-8">
      <div className="mx-4 flex text-rose-950 dark:text-teal-100">
        <Container className="relative flex w-full items-center justify-between gap-4 font-head sm:w-auto">
          <Logo />
          <div className="mt-2 flex flex-row flex-nowrap items-center gap-5 text-xs sm:mx-4 sm:mt-0 sm:text-base">
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
          <div className="flex h-full items-center">
            <ThemeToggleSsr />
          </div>
        </Container>
      </div>
    </header>
  );
};

export default HeaderAlt;
