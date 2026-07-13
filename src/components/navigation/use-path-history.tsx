"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const PathHistoryContext = createContext<string[]>([]);

export const PathHistoryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const pathname = usePathname();
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    if (pathname && pathHistory[pathHistory.length - 1] !== pathname) {
      setPathHistory((prev) => [...prev, pathname]);
    }
  }, [pathname, pathHistory]);

  return (
    <PathHistoryContext.Provider value={pathHistory}>
      {children}
    </PathHistoryContext.Provider>
  );
};

export const usePathHistory = () => {
  const context = useContext(PathHistoryContext);
  if (context === undefined) {
    throw new Error("usePathHistory must be used within a PathHistoryProvider");
  }
  return context;
};
