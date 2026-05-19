import { NotFound } from "./not-found";

export const HFNotFound: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-[calc(100svh-12rem)] w-full items-center justify-center">
      <NotFound>{children}</NotFound>
    </div>
  );
};
