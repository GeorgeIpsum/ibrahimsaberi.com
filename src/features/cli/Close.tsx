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

  return <div className="h-1 w-1 rounded-full bg-red-500"></div>;
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
