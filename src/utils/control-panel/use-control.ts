"use client";

import { useLayoutEffect, useRef } from "react";
import {
  type ControlInput,
  type ControlType,
  controlContext,
} from "./control-context";

export const useControl = <K extends string>(
  controls: { [key in K]: ControlInput<ControlType> },
) => {
  const latest = useRef(controls);
  latest.current = controls;

  const keyId = Object.keys(controls).join("::");

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyId is an intentional re-run trigger — re-register only when the key SET changes; the body reads latest.current
  useLayoutEffect(() => {
    const ctrls = latest.current;
    const keys = Object.keys(ctrls) as K[];
    for (const key of keys) controlContext.registerControl(key, ctrls[key]);
    return () => {
      for (const key of keys) controlContext.disposeControl(key);
    };
  }, [keyId]);

  // Reconcile latest values + handlers every render (cheap, silent).
  useLayoutEffect(() => {
    for (const key in controls) {
      controlContext.updateControl(key as K, controls[key as K]);
    }
  });
};
