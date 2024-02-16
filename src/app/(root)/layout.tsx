import { Footer, HeaderAlt } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="mx-auto w-full px-2 sm:px-6 lg:max-w-4xl">
      <HeaderAlt />
      <main className="pt-4">{children}</main>
      <Footer />
    </div>
  );
}
