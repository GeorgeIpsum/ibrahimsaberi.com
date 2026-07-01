"use client";

import { useEffect, useState } from "react";
import { useControl } from "@/features/control-panel";
import { LightRays, type LightRaysProps } from "./light-rays";

interface ModifiableLightRaysProps extends Omit<LightRaysProps, "color"> {
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}
export const ModifiableLightRays: React.FC<ModifiableLightRaysProps> = ({
  r = 255,
  g = 168,
  b = 92,
  a = 1,
  ...props
}) => {
  const [red, setRed] = useState(r);
  const [green, setGreen] = useState(g);
  const [blue, setBlue] = useState(b);
  const [alpha, setAlpha] = useState(a);

  useEffect(() => {
    setRed(r);
  }, [r]);

  useEffect(() => {
    setGreen(g);
  }, [g]);

  useEffect(() => {
    setBlue(b);
  }, [b]);

  useEffect(() => {
    setAlpha(a);
  }, [a]);

  useControl({
    "ray color": {
      type: "color",
      value: `${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue
        .toString(16)
        .padStart(2, "0")}`,
      onChange: (value) => {
        if (typeof value !== "string") return;
        const hex = value;
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          setRed(r);
          setGreen(g);
          setBlue(b);
        } else if (hex.length === 8) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const a = parseInt(hex.substring(6, 8), 16) / 255;
          setRed(r);
          setGreen(g);
          setBlue(b);
          setAlpha(a);
        } else if (hex.length === 3) {
          const r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
          const g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
          const b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
          setRed(r);
          setGreen(g);
          setBlue(b);
        } else if (hex.length === 4) {
          const r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
          const g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
          const b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
          const a = parseInt(hex.charAt(3) + hex.charAt(3), 16) / 255;
          setRed(r);
          setGreen(g);
          setBlue(b);
          setAlpha(a);
        } else {
          console.warn("Invalid hex color format:", hex);
        }
      },
    },
  });

  const color = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

  return <LightRays {...props} color={color} />;
};
