"use client";

import Link from "next/dist/client/link";
import { cn } from "@/css/lib";
import { Button } from "../atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../atoms/tooltip";
import { usePathHistory } from "./use-path-history";

export const Home: React.FC<
  React.PropsWithChildren<{
    alwaysShow?: boolean;
  }>
> = ({ alwaysShow = false, children }) => {
  const pathHistory = usePathHistory();
  const currentPath = pathHistory[pathHistory.length - 1];
  const lastPath = pathHistory[pathHistory.length - 2];

  const render = (show = true) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              suppressHydrationWarning
              className={cn(!show && "hidden")}
              variant="ghost"
              size="sm"
            />
          }
        >
          <Link href="/">{children ?? "Home"}</Link>
        </TooltipTrigger>
        <TooltipContent side={"bottom"}>???</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (alwaysShow) {
    return render();
  }

  if (typeof window !== "undefined") {
    const isHome = currentPath === "/";
    const wasHome = lastPath === "/";
    const isFromHome =
      lastPath === undefined && currentPath?.split("/").length === 2; // first page load on a subpath

    if (!wasHome || !isHome || !isFromHome) {
      return render();
    }
  }

  return render(false);
};
