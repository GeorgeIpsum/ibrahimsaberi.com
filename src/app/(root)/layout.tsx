import { Footer, HeaderAlt } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full lg:max-w-5xl">
      <HeaderAlt />
      <main className="mx-6 w-full">{children}</main>
      <Footer />
    </div>
  );
}
