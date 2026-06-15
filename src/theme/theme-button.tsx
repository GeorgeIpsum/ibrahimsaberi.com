"use client";

import {
  Circle,
  Contrast,
  MonitorSmartphone,
  MoonStar,
  Sun,
  SunMoon,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/atoms/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { Separator } from "@/components/atoms/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/atoms/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useControl } from "@/utils/control-panel/use-control";
import type { Contrast as ContrastValue, Theme } from "./types";
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
  const { theme, setTheme, contrast, setContrast } = useTheme();
  const isMobile = useMediaQuery({ max: "md" });
  // "system-light"/"system-dark" etc. are resolved system states — they
  // should highlight the system toggle, not the explicit ones.
  const themeValue = theme.startsWith("system") ? "system" : theme;
  const contrastValue = contrast.startsWith("system") ? "system" : contrast;
  const initialTheme = useRef(themeValue).current;
  const initialContrast = useRef(contrastValue).current;

  useControl({
    theme: {
      value: theme,
      options: ["system", "light", "dark"],
      onChange: (value) => setTheme(value as Theme),
    },
    contrast: {
      value: contrast,
      options: ["system", "normal", "high"],
      onChange: (value) => setContrast(value as ContrastValue),
    },
    ...Object.fromEntries(
      new Array(20).fill(0).map((_, i) => [`dummy${i}`, { value: "asdf" }]),
    ),
  });

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
        popoverProps={{ className: "px-2 py-2" }}
      >
        <TooltipProvider>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex flex-row items-start gap-1 md:flex-col">
              <div className="text-muted-foreground text-xs max-md:rotate-180 max-md:self-end max-md:[writing-mode:vertical-rl]">
                theme
              </div>
              <Separator orientation={isMobile ? "vertical" : "horizontal"} />
              <ToggleGroup
                defaultValue={[initialTheme]}
                value={[themeValue]}
                size="sm"
                orientation={isMobile ? "vertical" : "horizontal"}
                onValueChange={([value]) => {
                  if (value) setTheme(value as Theme);
                }}
              >
                <Tooltip>
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
                  <TooltipContent side="top">System Theme</TooltipContent>
                </Tooltip>
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
                  <TooltipContent side="top">Light Theme</TooltipContent>
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
                  <TooltipContent side="top">Dark Theme</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </div>
            <div className="flex flex-row items-start gap-1 md:flex-col">
              <div className="text-muted-foreground text-xs max-md:rotate-180 max-md:self-end max-md:[writing-mode:vertical-rl]">
                contrast
              </div>
              <Separator orientation={isMobile ? "vertical" : "horizontal"} />
              <ToggleGroup
                defaultValue={[initialContrast]}
                size="sm"
                value={[contrastValue]}
                orientation={isMobile ? "vertical" : "horizontal"}
                onValueChange={([value]) => {
                  if (value) setContrast(value as ContrastValue);
                }}
              >
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <ToggleGroupItem
                        aria-label="System Contrast"
                        value="system"
                        size="sm"
                      />
                    }
                  >
                    <MonitorSmartphone />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">System Contrast</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <ToggleGroupItem
                        aria-label="Normal Contrast"
                        value="normal"
                        size="sm"
                      />
                    }
                  >
                    <Circle />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Normal Contrast</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <ToggleGroupItem
                        aria-label="High Contrast"
                        value="high"
                        size="sm"
                      />
                    }
                  >
                    <Contrast />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">High Contrast</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </div>
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
