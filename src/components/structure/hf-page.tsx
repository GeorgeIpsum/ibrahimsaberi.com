import { useCallback } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

interface HFPageProps {
  render?: (props: React.PropsWithChildren) => React.ReactNode;
}
export const HFPage: React.FC<React.PropsWithChildren<HFPageProps>> = ({
  children,
  render,
}) => {
  const renderContent = useCallback(
    () =>
      render ? (
        render({ children })
      ) : (
        <main className="flex-1 py-4">{children}</main>
      ),
    [render, children],
  );

  return (
    <div className="mx-auto flex h-full w-full flex-col px-2 sm:px-6 lg:max-w-2xl">
      <Header />
      {renderContent()}
      <Footer />
    </div>
  );
};
