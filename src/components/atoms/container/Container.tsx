import { type VariantProps, cva, cx } from "class-variance-authority";

const $styles = cva(["container", "rounded-lg"], {
  variants: {
    padding: {
      sm: ["px-2", "py-1"],
      md: ["px-3", "py-2"],
      lg: ["p-4"],
      custom: [],
    },
    bg: {
      transparent: ["bg-pink-400/10 dark:bg-emerald-800/10"],
      translucent: ["bg-pink-400/50 dark:bg-emerald-800/50"],
      opaque: ["bg-pink-300/95 dark:bg-green-950/95"],
    },
  },
  defaultVariants: {
    padding: "md",
    bg: "transparent",
  },
});

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof $styles> {}
const Container: React.FC<React.PropsWithChildren<ContainerProps>> = ({
  children,
  padding,
  bg,
  ...props
}) => {
  const className = $styles({ padding, bg, className: props.className });
  return (
    <div
      {...props}
      className={cx(className, "bg-pink-400/10 dark:bg-emerald-800/10")}
    >
      {children}
    </div>
  );
};

export default Container;
