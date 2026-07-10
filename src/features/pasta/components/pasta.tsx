import { LineSquiggle } from "lucide-react";
import { Suspense } from "react";
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

export const Pasta: React.FC<{
  searchParams: Promise<{ noodle?: string }>;
}> = ({ searchParams }) => {
  return (
    <Suspense fallback={<div>Cooking...</div>}>
      <RawPasta searchParams={searchParams} />
    </Suspense>
  );
};

const RawPasta: React.FC<{
  searchParams: Promise<{ noodle?: string }>;
}> = async ({ searchParams }) => {
  const params = await searchParams;

  if (params.noodle) {
    return <CookedPasta noodle={params.noodle} />;
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

const CookedPasta: React.FC<{ noodle: string }> = async ({ noodle }) => {
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
      <div className="absolute right-1/2 -bottom-25 flex items-start justify-center gap-2 max-md:translate-x-1/2 md:-right-26 md:-bottom-4 md:flex-col">
        <GoToRawPasta noodle={noodle} />
        <CopyThatPasta pasta={pastaText} />
      </div>
    </>
  );
};
