import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Continue } from "../components/continue";
import type { Step } from "../components/stepper";
import { useStepperContext } from "../components/stepper/context";
import { TextStream } from "../components/text-stream";

export const Click: React.FC = () => {
  const { next } = useStepperContext();
  const [total, setTotal] = useState(0);
  const [canMoveNext, setCanMoveNext] = useState(false);
  const nextTimeout = useRef<NodeJS.Timeout | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: recreate timeout on total change
  useEffect(() => {
    if (nextTimeout.current) {
      clearTimeout(nextTimeout.current);
    }

    nextTimeout.current = setTimeout(() => {
      setCanMoveNext(true);
    }, 6000);

    return () => {
      if (nextTimeout.current) {
        clearTimeout(nextTimeout.current);
      }
    };
  }, [total]);

  return (
    <>
      <TextStream text="Click as many times as you want." />
      <Button
        variant="outline"
        className="font-mono"
        onClick={() => setTotal(total + 1)}
      >
        {total}
      </Button>
      <Continue show={canMoveNext} onClick={() => next({ total })} />
    </>
  );
};

export const clickStep = (): Step => ({
  id: "click",
  render: Click,
});
