"use client";

import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

export const Xterm: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
    } else {
      return;
    }

    if (terminalRef.current) {
      const term = new Terminal();
      term.open(terminalRef.current);
      term.write("Coming soon :)\r\n");

      return () => {
        term.dispose();
      };
    }
  }, []);

  return <div ref={terminalRef} className="size-full" />;
};
