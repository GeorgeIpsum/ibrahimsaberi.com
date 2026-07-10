import { ScrollArea } from "@/components/atoms/scroll-area";
import { PastaOptions } from "./options";
import { Pasta } from "./pasta";

export const PastaPlate: React.FC<{ noodle?: string }> = ({ noodle }) => {
  return (
    <>
      <h1>pasta tiem</h1>
      <PastaOptions noodle={noodle} />
      <div className="relative my-4 flex h-[calc(100svh-18rem)] w-full rounded-2xl border border-border bg-card p-4">
        <ScrollArea>
          <Pasta noodle={noodle} />
        </ScrollArea>
      </div>
    </>
  );
};
