"use client";

import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import { useCustomTheme } from "@/features/theme/use-custom-theme";

export const ReflectTheme: React.FC = () => {
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();
  console.log(pathname, segments);

  useCustomTheme({
    primary: "",
    background: "",
    border: "",
  });

  return null;
};
