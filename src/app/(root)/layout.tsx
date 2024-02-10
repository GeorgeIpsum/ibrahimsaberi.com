import { Footer, HeaderAlt } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full lg:max-w-4xl">
      <HeaderAlt />
      <main className="w-full pt-4 md:max-w-3xl lg:ml-10 lg:mr-auto lg:w-[calc(100%-8rem)] xl:ml-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
