"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { useHistory } from "./history-provider";

interface GoBackProps {
  icon?: React.ReactNode;
}
export const GoBack: React.FC<React.PropsWithChildren<GoBackProps>> = ({
  icon,
  children,
}) => {
  const router = useRouter();
  const history = useHistory();

  const renderIcon = () => {
    if (icon) return icon;
    return <ArrowLeft size={18} />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="sm" onClick={() => router.back()} />
          }
        >
          {renderIcon()}
          {children ?? <span>Go back</span>}
        </TooltipTrigger>
        <TooltipPopup side="right">
          Return to{" "}
          {typeof window === "undefined"
            ? "previous page"
            : (history.entries[history.entries.length - 2] ?? "previous page")}
        </TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
};
