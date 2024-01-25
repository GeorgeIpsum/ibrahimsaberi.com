import Better from "@/components/svg/Better";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("@/components/theme/ThemeToggle"), {
  ssr: false,
});

const Home: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl sm:pt-24">
      <div className="flex flex-col flex-nowrap sm:flex-row">
        <header className="flex w-full flex-row px-4 py-2 sm:w-32 sm:flex-col sm:px-8">
          <div className="w-8 sm:w-full">
            <Better />
          </div>
        </header>
        <main className="max-w-4xl flex-1 flex-grow px-3">
          hello world :)
          <ThemeToggle />
        </main>
      </div>
    </div>
  );
};

export default Home;
