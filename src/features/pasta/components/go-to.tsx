"use client";
import { Link } from "lucide-react";
import { Button } from "@/components/atoms/button";

export const GoToRawPasta: React.FC<{ noodle: string }> = ({ noodle }) => {
  return (
    <Button
      variant="outline"
      onClick={() => window.open(`/api/pasta?noodle=${noodle}`, "_blank")}
    >
      <Link />
      <span className="ml-0 text-xs">Raw</span>
    </Button>
  );
};
