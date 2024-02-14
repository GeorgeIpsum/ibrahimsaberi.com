import ThemeToggle from "@/features/theme/ThemeToggle";

import { Container } from "../atoms";
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
        <Container className="isolate mt-2 rounded-lg p-1" padding="custom">
          <ul className="appearance-none children:isolate children:flex children:w-full children:items-center children:gap-2 children:rounded children:px-2 children:py-1 children:text-right children:transition-all children:duration-300 hover:children:bg-slate-950/10">
            <li className="sm:hidden">
              Theme <ThemeToggle />
            </li>
            <li>More Coming Soon™</li>
          </ul>
        </Container>
      </div>
    </button>
  );
};

export default SettingsGear;
