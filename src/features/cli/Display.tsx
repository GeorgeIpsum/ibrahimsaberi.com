"use client";

import { useEffect } from "react";

interface DisplayProps {
  listen?: boolean;
}
const Display: React.FC<DisplayProps> = ({ listen = true }) => {
  useEffect(() => {
    const listener = (e: any) => {};

    if (listen) {
      window.addEventListener("connect-cli", listener);

      return () => {
        window.removeEventListener("connect-cli", listener);
      };
    }
  }, []);

  return (
    <div className="mt-2 flex max-h-[calc(96px)] w-full flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-t-lg bg-pink-100 px-2 pb-[2px] pt-2 font-mono text-sm leading-[18px] text-fuchsia-950 shadow shadow-purple-400/40 backdrop-blur-lg children:flex-shrink-0 children:flex-grow dark:bg-green-950/80 dark:text-green-50 dark:shadow-green-800/30 lg:max-h-[unset]"></div>
  );
};

export default Display;
