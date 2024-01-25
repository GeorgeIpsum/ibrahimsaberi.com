"use client";

import { useEffect, useRef } from "react";

import { cx } from "class-variance-authority";
import { Gradient as G } from "whatamesh";

interface GradientProps {
  id: string;
  className?: string;
}
const Gradient: React.FC<React.PropsWithChildren<GradientProps>> = ({
  children,
  id,
  className,
}) => {
  const GradientCanvas = useRef(new G());

  useEffect(() => {
    GradientCanvas.current.initGradient(`#${id}`);
  }, []);

  return (
    <>
      <canvas
        id={id}
        className={cx("absolute bottom-0 left-0 right-0 top-0", className)}
      />
      {children}
    </>
  );
};

export default Gradient;
