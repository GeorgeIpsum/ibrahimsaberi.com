import { GoBack } from "@/components/navigation/go-back";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="absolute top-4 left-4">
        <GoBack />
      </div>
      <div className="mx-auto w-full max-w-md p-4 sm:w-auto sm:min-w-xl">
        {children}
      </div>
    </main>
  );
}
