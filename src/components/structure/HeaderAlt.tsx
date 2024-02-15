import Link from "next/link";

import ThemeToggleSsr from "@/features/theme/ThemeToggleSsr";

import { Container } from "../atoms";
import { Logo } from "../navigation";
import SettingsGear from "../navigation/SettingsGear";
import { headerLinks } from "../navigation/links";

const HeaderAlt: React.FC = () => {
  return (
    <header className="sticky top-0 mt-2 sm:mt-6">
      <div className="flex items-stretch justify-between text-rose-950 dark:text-teal-100 sm:gap-4">
        <Container className="relative flex w-full items-center justify-between gap-4 font-head sm:w-auto sm:gap-12">
          <Logo />
          <div className="hidden flex-row flex-nowrap items-center gap-2 text-xs sm:mx-4 sm:flex sm:text-base">
            {headerLinks.map(({ href, display, title }) => (
              <Link
                className="block p-2 font-mono lowercase"
                key={display}
                href={href}
                title={title}
              >
                {display}
              </Link>
            ))}
          </div>
          <div className="mx-4 mt-1 flex text-xl sm:hidden">🌧️⛈️🌧️🌧️</div>
        </Container>
        <div className="ml-2 flex items-center justify-center sm:hidden">
          <SettingsGear />
        </div>
        <Container
          className="static hidden w-fit items-center gap-2 rounded-xl px-3 sm:relative sm:flex"
          padding="custom"
        >
          <SettingsGear />
          <div className="flex h-full items-center">
            <ThemeToggleSsr />
          </div>
        </Container>
      </div>
    </header>
  );
};

export default HeaderAlt;
