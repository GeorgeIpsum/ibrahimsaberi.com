"use client";

import ThemeToggle from "@/features/theme/ThemeToggle";

import { Container } from "../atoms";
import { Gear } from "../svg";

const SettingsGear: React.FC = () => {
  const onClick = () => {
    if (typeof document !== "undefined") {
      const settingsGears = document.querySelectorAll(
        ".settings-gear-check"
      ) as NodeListOf<HTMLInputElement>;

      if (settingsGears) {
        settingsGears.forEach((gear) => {
          gear.checked = !gear.checked;
        });
      }
    }
  };

  return (
    <button
      onClick={onClick}
      className="settings-gear group grid h-full place-content-center place-items-center p-[2px] transition-all duration-150"
    >
      <input hidden type="checkbox" defaultChecked={false} />
      <div className="settings-gear-check -z-10 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-300 bg-gradient-to-br from-rose-600/30 to-pink-200/30 transition-all duration-150 group-hover:bg-pink-200  group-hover:opacity-0 dark:bg-emerald-700 dark:from-teal-500/50 dark:to-emerald-800/50 group-hover:dark:bg-emerald-800" />
      <div className="-z-20 col-start-1 col-end-1 row-start-1 row-end-1 h-7 w-7 rounded-full bg-pink-200  transition-all duration-150 dark:bg-emerald-800" />
      <Gear
        height={20}
        width={20}
        className="svg col-start-1 col-end-1 row-start-1 row-end-1 fill-rose-50/90 transition-all duration-500 group-hover:rotate-180 group-hover:fill-white dark:fill-emerald-100/80 "
      />
      <div className="settings-menu absolute right-0 top-full min-w-24">
        <Container className="isolate mt-2 rounded-lg" padding="sm">
          <ul className="appearance-none children:isolate children:-mx-2 children:flex children:items-center children:gap-2 children:rounded-sm children:px-2 children:py-1 children:transition-all children:duration-300 children:hover:bg-slate-950/10">
            <li className="sm:hidden">
              Theme <ThemeToggle />
            </li>
            <li>asdf</li>
            <li>asdf</li>
            <li>asdf</li>
          </ul>
        </Container>
      </div>
    </button>
  );
};

export default SettingsGear;
