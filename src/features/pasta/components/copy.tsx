"use client";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export const CopyThatPasta: React.FC<{ pasta: string }> = ({ pasta }) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <Button variant="outline" size="xs" onClick={() => copyToClipboard(pasta)}>
      {isCopied ? <Check /> : <Copy />}
      <span className="ml-0 text-xs">{isCopied ? "Copied!" : "Copy"}</span>
    </Button>
  );
};
