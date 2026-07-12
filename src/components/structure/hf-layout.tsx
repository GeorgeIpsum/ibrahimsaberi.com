import { useCallback } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

interface HFPageProps {
  render?: (props: React.PropsWithChildren) => React.ReactNode;
}
export const HFLayout: React.FC<React.PropsWithChildren<HFPageProps>> = ({
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
    <div className="mx-auto flex h-full w-full flex-col md:max-w-2xl">
      <Header />
      <div className="min-h-[calc(100svh-14rem)] px-4 md:px-4">
        {renderContent()}
      </div>
      <Footer />
    </div>
  );
};
