import { LineSquiggle } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/atoms/empty";
import { cn } from "@/css/lib";
import { copypasta } from "../pasta";
import { CopyThatPasta } from "./copy";
import { GoToRawPasta } from "./go-to";

export const Pasta: React.FC<{ noodle?: string }> = ({ noodle }) => {
  if (noodle) {
    return <CookedPasta noodle={noodle} />;
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LineSquiggle />
        </EmptyMedia>
        <EmptyTitle>No pasta yet...</EmptyTitle>
        <EmptyDescription>C'mon now... it's waiting...</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>The beast demands pasta.</EmptyContent>
    </Empty>
  );
};

const CookedPasta: React.FC<{ noodle: string }> = ({ noodle }) => {
  const pasta = copypasta.find((p) => p.title === `${noodle}.txt`);

  if (!pasta) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LineSquiggle />
          </EmptyMedia>
          <EmptyTitle>INVALID PASTA?</EmptyTitle>
          <EmptyDescription>HOW COULD YOU DO THIS???</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>WE DEMAND PASTA!!!!!!!!!!</EmptyContent>
      </Empty>
    );
  }

  const pastaText = pasta.content;
  // this is very dumb. it also works.
  const isAsciiArt =
    /[⣿]|[ඞ]|(?:::)|(?:@@@)|(?:;;;;)|(?:„„)|(?:\s\s\s\s\s)/gu.test(pastaText);

  return (
    <>
      <pre
        className={cn(
          "text-xs",
          isAsciiArt ? "whitespace-pre" : "whitespace-pre-line",
        )}
      >
        {pastaText}
      </pre>
      <div className="absolute right-0 -bottom-23.5 flex items-stretch justify-center gap-2 bg-background max-md:left-0 max-md:w-1/2 sm:-bottom-22.5 md:-top-4 md:-right-22 md:bottom-0 md:flex-col md:justify-start md:gap-4">
        <GoToRawPasta noodle={noodle} />
        <CopyThatPasta pasta={pastaText} />
      </div>
    </>
  );
};
