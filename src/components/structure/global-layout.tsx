import Link from "next/link";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { GoBack } from "../navigation/go-back";

export const GlobalLayout: React.FC<
  React.PropsWithChildren<{ header?: string }>
> = ({ header, children }) => {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="absolute top-4 right-0 left-0 flex w-full items-center gap-4 px-4 md:top-8 md:px-12">
        <GoBack>Back</GoBack>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="sm" />}>
              <Link href="/">Home</Link>
            </TooltipTrigger>
            <TooltipContent side={"bottom"}>???</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!!header && (
          <h1 className="ml-auto font-heading leading-0">{header}</h1>
        )}
      </div>
      <div className="mx-auto w-full max-w-md p-4 sm:w-auto sm:min-w-xl">
        {children}
      </div>
    </main>
  );
};
