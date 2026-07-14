"use client";

import { useEffect, useRef, useState } from "react";
import { TokenStream } from "@/components/text/token-stream";
import { useControl } from "@/features/control-panel/use-control";
import { randomArrayMember } from "@/utils/rand";
import { toolsOfThe } from "../strings";

export const ToolsOfThe: React.FC = () => {
  const [tool, setTool] = useState("?");
  const [backgroundColor, setBackgroundColor] = useState("bg-none");
  const [controlled, setControlled] = useState(false);
  const t1 = useRef<NodeJS.Timeout>(null);
  const t2 = useRef<NodeJS.Timeout>(null);

  useControl({
    "?": {
      value: tool,
      options: toolsOfThe,
      onChange: (newTool) => {
        setControlled(true);
        setBackgroundColor("bg-primary/50");
        t2.current = setTimeout(() => {
          setTool(newTool as string);
          setBackgroundColor("bg-none");
        }, 600);
      },
    },
  });

  useEffect(() => {
    if (controlled) {
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    }
  }, [controlled]);

  return (
    <TokenStream
      key={tool}
      text={tool}
      speedMs={[70, 150]}
      tokenize={(text) => text.split("")}
      delayMs={1200}
      caretClassName="h-6!"
      className={backgroundColor}
      onComplete={() => {
        if (!controlled) {
          t1.current = setTimeout(() => {
            setBackgroundColor("bg-primary/50");
            t2.current = setTimeout(() => {
              setTool(randomArrayMember(toolsOfThe));
              setBackgroundColor("bg-none");
            }, 600);
          }, 3000);
        }
      }}
    />
  );
};
