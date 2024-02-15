import Link from "next/link";

import ThemeToggle from "@/features/theme/ThemeToggle";

import { Container } from "../atoms";
import { headerLinks, settingsLinks } from "../navigation/links";
import { Gear } from "../svg";

const SettingsGear: React.FC = () => {
  return (
    <button className="settings-gear group grid h-full place-content-center place-items-center py-2 transition-all duration-150">
      <div className="settings-gear-check -z-10 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-300 bg-gradient-to-br from-rose-600/30 to-pink-200/30 transition-all duration-150 group-hover:bg-pink-200 group-hover:opacity-0 group-active:bg-pink-200 group-active:opacity-0 dark:bg-emerald-700 dark:from-teal-500/50 dark:to-emerald-800/50 group-hover:dark:bg-emerald-800" />
      <div className="-z-20 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-200  transition-all duration-150 dark:bg-emerald-800" />
      <Gear
        height={20}
        width={20}
        className="svg col-start-1 col-end-1 row-start-1 row-end-1 fill-rose-50/90 transition-all duration-500 group-hover:rotate-180 group-hover:fill-white dark:fill-emerald-100/80 "
      />
      <div className="settings-menu absolute right-0 top-full min-w-full sm:min-w-[200%]">
        <Container
          className="isolate mt-2 rounded-lg p-1"
          padding="custom"
          bg="opaque"
        >
          <ul className="appearance-none hover:children:bg-fuchsia-400/20 hover:children:dark:bg-emerald-200/10">
            <li className="setting items-center justify-between sm:hidden">
              Theme <ThemeToggle />
            </li>
            {headerLinks.map(({ href, display, title, emoji }) => (
              <li key={title} className="nav sm:hidden">
                <Link className="w-full" href={href} title={title}>
                  <span>{emoji}</span> {display}
                </Link>
              </li>
            ))}
            {settingsLinks.map(({ href, display, title, emoji }) => (
              <li key={title} className="nav">
                <Link className="w-full" href={href} title={title}>
                  <span>{emoji}</span> {display}
                </Link>
              </li>
            ))}
            <li>More Coming Soon™</li>
          </ul>
        </Container>
      </div>
    </button>
  );
};

export default SettingsGear;
