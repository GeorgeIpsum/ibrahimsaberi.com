"use client";

import { FitAddon } from "@xterm/addon-fit";
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
      const term = new Terminal({});
      term.open(terminalRef.current);
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.write("Coming soon :)\r\n");
      fitAddon.fit();

      return () => {
        term.dispose();
      };
    }
  }, []);

  return <div ref={terminalRef} className="size-full" />;
};
