import { use } from "react";

const reasonMap = {
  penance: "Reflect before you proceed.",
  pontification: "Your authority is not recognized. Now, fall.",
};

interface PenanceProps {
  searchParams: Promise<{ reason?: string }>;
}
export const Penance: React.FC<PenanceProps> = ({ searchParams }) => {
  const reason = use(searchParams).reason;

  if (!reason) {
    return null;
  }

  return (
    <div className="fade-in pointer-events-none fixed right-0 bottom-2 left-0 flex h-10 w-screen animate-in select-none items-center justify-center text-center duration-3000 md:bottom-4">
      {reasonMap[reason as keyof typeof reasonMap] ?? "You are unworthy."}
    </div>
  );
};
