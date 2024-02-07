import { type VariantProps, cva, cx } from "class-variance-authority";

const $styles = cva(["container", "rounded-lg"], {
  variants: {
    padding: {
      sm: ["px-2", "py-1"],
      md: ["px-3", "py-2"],
      lg: ["p-4"],
      custom: [],
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof $styles> {}
const Container: React.FC<React.PropsWithChildren<ContainerProps>> = ({
  children,
  padding,
  ...props
}) => {
  const className = $styles({ padding, className: props.className });
  return (
    <div
      {...props}
      className={cx(className, "bg-pink-400/10 dark:bg-emerald-100/10")}
    >
      {children}
    </div>
  );
};

export default Container;
