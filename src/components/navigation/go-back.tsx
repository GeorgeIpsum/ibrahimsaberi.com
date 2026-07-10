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
}
export const GoBack: React.FC<React.PropsWithChildren<GoBackProps>> = ({
  icon,
  children,
}) => {
  const router = useRouter();

  const renderIcon = () => {
    if (icon) return icon;
    return <ArrowLeft size={18} />;
  };

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
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
        <TooltipContent side="top">From whence you came</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
