"use client";

import { useRef } from "react";

import { useHotkeys } from "@/hooks";

interface CliProps {
  platform: string;
}
const Cli: React.FC<CliProps> = ({ platform }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys(
    [
      [
        ["/", "CTRL+K", "META+K"],
        () => {
          inputRef.current?.focus();
        },
      ],
    ],
    ["INPUT"]
  );

  useHotkeys(
    [
      [
        "ESCAPE",
        () => {
          if (inputRef.current === document.activeElement) {
            inputRef.current?.blur();
          }
        },
      ],
    ],
    []
  );

  let metaKey =
    typeof window === "undefined"
      ? platform === "Mac"
        ? "CMD"
        : "CTRL"
      : window.navigator.userAgent.toUpperCase().includes("MAC")
        ? "CMD"
        : "CTRL";

  return (
    <form className="w-full">
      <input
        ref={inputRef}
        className="mb-2 w-full rounded-b-md bg-pink-50/95 p-3 font-mono text-sm shadow-inner shadow-purple-500/50 outline-none selection:bg-pink-300 dark:bg-zinc-950 dark:shadow-black/40 dark:selection:bg-emerald-700"
        placeholder={`[/] or [${metaKey}+K]`}
      />
    </form>
  );
};

export default Cli;
