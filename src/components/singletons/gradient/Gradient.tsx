"use client";

import { useEffect, useRef } from "react";

import { cx } from "class-variance-authority";
import { Gradient as G } from "whatamesh";

import { useDarkMode } from "../../../features/theme/useDarkMode";

interface GradientProps {
  id: string;
  className?: string;
}
const Gradient: React.FC<React.PropsWithChildren<GradientProps>> = ({
  children,
  id,
  className,
}) => {
  const { isDarkMode } = useDarkMode();
  const GradientCanvas = useRef(new G());

  useEffect(() => {
    const grad = GradientCanvas.current;
    grad.initGradient(`#${id}`);

    return () => {
      grad.pause();
    };
  }, [isDarkMode]);

  return (
    <>
      <canvas
        id={id}
        className={cx(
          "absolute bottom-0 left-0 right-0 top-0",
          className,
          "transition-all"
        )}
      />
      {children}
    </>
  );
};

export default Gradient;
