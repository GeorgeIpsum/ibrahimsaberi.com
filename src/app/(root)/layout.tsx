import { Footer, HeaderAlt } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full lg:max-w-4xl">
      <HeaderAlt />
      <main className="md:mx-auto md:max-w-3xl lg:w-full">{children}</main>
      <Footer />
    </div>
  );
}
