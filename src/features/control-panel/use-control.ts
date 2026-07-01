"use client";

import { useLayoutEffect, useRef } from "react";
import {
  type ControlGroupOptions,
  type ControlInput,
  type ControlType,
  controlContext,
} from "./control-context";

let groupIdCounter = 0;

export const useControl = <K extends string>(
  controls: { [key in K]: ControlInput<ControlType> },
  options?: ControlGroupOptions,
) => {
  const latest = useRef(controls);
  latest.current = controls;

  const latestOptions = useRef(options);
  latestOptions.current = options;

  // Stable id for this hook instance so all of its keys share one group.
  const groupId = useRef("");
  if (!groupId.current) groupId.current = `g${groupIdCounter++}`;

  const keyId = Object.keys(controls).join("::");

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyId is an intentional re-run trigger — re-register only when the key SET changes; the body reads latest.current
  useLayoutEffect(() => {
    const ctrls = latest.current;
    const gid = groupId.current;
    const keys = Object.keys(ctrls) as K[];
    for (const key of keys)
      controlContext.registerControl(key, ctrls[key], gid);
    return () => {
      for (const key of keys) controlContext.disposeControl(key);
    };
  }, [keyId]);

  // Reconcile latest values + handlers + group options every render (cheap, silent).
  useLayoutEffect(() => {
    controlContext.setGroupMeta(groupId.current, latestOptions.current);
    for (const key in controls) {
      controlContext.updateControl(key as K, controls[key as K]);
    }
  });
};
