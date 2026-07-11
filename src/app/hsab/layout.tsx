import { GoBack } from "@/components/navigation/go-back";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="font-heading text-4xl">The Sandbox</h1>
      <div className="w-full p-4 sm:w-auto sm:min-w-xl">{children}</div>
      <GoBack />
    </div>
  );
}
