import { Footer, HeaderAlt } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full lg:max-w-4xl">
      <HeaderAlt />
      <main className="pt-4 lg:ml-10 lg:mr-auto xl:ml-auto">{children}</main>
      <Footer />
    </div>
  );
}
