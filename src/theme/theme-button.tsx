"use client";

import { /* MonitorSmartphone, */ MoonStar, Sun, SunMoon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/atoms/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/atoms/toggle-group";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import type { Theme } from "./types";
import { useTheme } from "./use-theme";

interface ThemeButtonProps {
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  className?: string;
}
export const ThemeButton: React.FC<ThemeButtonProps> = ({
  size = "icon-xs",
  variant = "outline",
  side,
  align,
  className,
}) => {
  const { theme, setTheme } = useTheme();
  const initialTheme = useRef(theme).current;

  return (
    <Popover>
      <PopoverTrigger
        render={<Button size={size} variant={variant} className={className} />}
      >
        <SunMoon />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        popoverProps={{ className: "px-1 py-1" }}
      >
        <TooltipProvider>
          <ToggleGroup
            orientation="vertical"
            defaultValue={[initialTheme]}
            value={[theme]}
            onValueChange={([value]) => {
              if (value) setTheme(value as Theme);
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    aria-label="Light Theme"
                    value="light"
                    size="sm"
                  />
                }
              >
                <Sun />
              </TooltipTrigger>
              <TooltipPopup side="left">Light Theme</TooltipPopup>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    aria-label="Dark Theme"
                    value="dark"
                    size="sm"
                  />
                }
              >
                <MoonStar />
              </TooltipTrigger>
              <TooltipPopup side="left">Dark Theme</TooltipPopup>
            </Tooltip>
            {/* <Tooltip>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    aria-label="System Theme"
                    value="system"
                    size="sm"
                  />
                }
              >
                <MonitorSmartphone />
              </TooltipTrigger>
              <TooltipPopup side="left">System Theme</TooltipPopup>
            </Tooltip> */}
          </ToggleGroup>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
