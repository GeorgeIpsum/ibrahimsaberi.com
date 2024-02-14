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
    <header className="sticky top-0 mx-2 mt-6 sm:ml-6 sm:mt-8">
      <div className="flex items-stretch justify-between gap-4 text-rose-950 dark:text-teal-100">
        <Container className="relative flex w-full items-center justify-between gap-4 font-head sm:w-auto sm:gap-12">
          <Logo />
          <div className="flex flex-row flex-nowrap items-center gap-2 text-xs sm:mx-4 sm:gap-6 sm:text-base">
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
        </Container>
        <Container className="flex w-auto items-center gap-2 sm:gap-4">
          <ThemeToggleSsr />
          <button className="flex flex-col gap-1 py-2 pl-2 pr-2 children:h-1 children:w-1 children:rounded-full children:bg-fuchsia-500 children:dark:bg-emerald-300 sm:pr-4">
            <div></div>
            <div></div>
            <div></div>
          </button>
        </Container>
      </div>
    </header>
  );
};

export default HeaderAlt;
