import { cn } from "@/css/lib";
import { titleClassName, titleContainerClassName } from "./title.css";

type TitleProps = React.PropsWithChildren<{
  containerClassName?: string;
  className?: string;
  title?: string;
  /** Rendered as a sibling before the h1, e.g. a decorative icon. */
  adornment?: React.ReactNode;
}>;

export const Title: React.FC<TitleProps> = ({
  adornment,
  children,
  title,
  className,
  containerClassName,
}) => (
  <div className={cn(titleContainerClassName, containerClassName)}>
    {adornment}
    <h1 title={title} className={cn(titleClassName, className)}>
      {children}
    </h1>
  </div>
);
