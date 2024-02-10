"use client";

import { useRef } from "react";

import { useHotkeys } from "@/hooks";

const Close: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);

  const toggle = () => {
    if (ref.current) {
      if (ref.current.checked) ref.current.checked = false;
      else ref.current.checked = true;
    }
  };

  useHotkeys([
    [
      ["ALT+META+H", "ALT+CTRL+H"],
      () => {
        toggle();
      },
    ],
  ]);

  return (
    <div className="absolute -top-4 right-0 mx-3 flex h-4 w-12 select-none items-center justify-center rounded-t bg-pink-200 shadow shadow-fuchsia-800/30 dark:bg-green-950 dark:shadow-black/40 lg:-left-7 lg:bottom-12 lg:right-[unset] lg:top-[unset] lg:h-12 lg:w-4 lg:rounded-l lg:rounded-tr-none">
      <input
        id="close-drawer"
        ref={ref}
        type="checkbox"
        data-checkbox="arrow"
      />
    </div>
  );
};

/**
 * allows programmatically controlling drawer open/close state outside of react-land
 *
 * @returns {boolean} true if the drawer close input was found and toggled. False if not
 */
export const toggleCliDrawer = () => {
  if (typeof document === "undefined") return false;
  const drawerClose = document.querySelector(
    "#close-drawer"
  ) as HTMLInputElement | null;
  if (!drawerClose) return false;
  if (drawerClose.checked) drawerClose.checked = false;
  else drawerClose.checked = true;

  return true;
};

export default Close;
