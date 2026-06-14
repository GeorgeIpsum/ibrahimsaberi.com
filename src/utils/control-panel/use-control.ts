"use client";

import { useLayoutEffect } from "react";
import {
  type ControlInput,
  type ControlType,
  controlContext,
} from "./control-context";

export const useControl = <K extends string>(
  controls: { [key in K]: ControlInput<ControlType> },
) => {
  const { registerControl } = controlContext;

  useLayoutEffect(() => {
    for (const key in controls) {
      registerControl(key, controls[key]);
    }
  }, [controls]);
};
