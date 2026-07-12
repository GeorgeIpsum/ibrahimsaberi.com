"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";

interface GoBackProps {
  icon?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}
export const GoBack: React.FC<React.PropsWithChildren<GoBackProps>> = ({
  icon,
  children,
  side,
}) => {
  const router = useRouter();

  const renderIcon = () => {
    if (icon) return icon;
    return <ArrowLeft size={18} />;
  };

  const goBack = () => {
    const canGoBack =
      "navigation" in window
        ? window.navigation.canGoBack
        : (window as Window).history.length > 1; // fallback heuristic for older browsers

    if (canGoBack) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="sm" onClick={goBack} />}
        >
          {renderIcon()}
          {children ?? <span>Go back</span>}
        </TooltipTrigger>
        <TooltipContent side={side ?? "bottom"}>
          From whence you came
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
