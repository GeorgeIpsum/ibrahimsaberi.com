import Link from "next/link";

import ThemeToggleSsr from "@/features/theme/ThemeToggleSsr";

import { Container } from "../atoms";
import { Logo } from "../navigation";
import { Gear } from "../svg";

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
    <header className="sticky top-0 mt-2 sm:mt-6">
      <div className="flex items-stretch justify-between text-rose-950 dark:text-teal-100 sm:gap-4">
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
        <div className="flex items-center justify-center p-1 sm:hidden">
          <SettingsGear />
        </div>
        <Container className="hidden w-fit items-center gap-2 rounded-xl sm:flex">
          <SettingsGear />
          <div className="flex h-full items-center">
            <ThemeToggleSsr />
          </div>
        </Container>
      </div>
    </header>
  );
};

const SettingsGear: React.FC = () => {
  return (
    <button className="group grid h-full place-content-center place-items-center  p-[2px] transition-all duration-150">
      <div className="-z-10 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-300 bg-gradient-to-br from-rose-600/30 to-pink-200/30 transition-all duration-150 group-hover:bg-pink-200  group-hover:opacity-0 dark:bg-emerald-700 dark:from-teal-500/50 dark:to-emerald-800/50 group-hover:dark:bg-emerald-800" />
      <div className="-z-20 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-200  transition-all duration-150 dark:bg-emerald-800" />
      <Gear
        height={20}
        width={20}
        className="col-start-1 col-end-1 row-start-1 row-end-1 fill-rose-50/90 transition-all duration-500 group-hover:rotate-180 group-hover:fill-white dark:fill-emerald-100/80 "
      />
    </button>
  );
};

export default HeaderAlt;
