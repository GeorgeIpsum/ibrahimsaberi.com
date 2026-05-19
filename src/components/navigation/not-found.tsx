import Link from "next/link";

import { GoBack } from "./go-back";

export const NotFound: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-full w-full min-w-auto px-6 sm:mx-auto sm:min-w-lg sm:max-w-xl sm:px-0">
        <div
          className="relative flex h-full w-full flex-col p-4 text-center text-lg md:px-16"
          // padding="custom"
        >
          <div className="z-10 flex w-full justify-start">
            <GoBack />
          </div>
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center">
            <h1 className="mb-4 font-semibold text-5xl">Hmmm...</h1>
            <h2 className="mb-4">Sorry, couldn&apos;t find that.</h2>
            {children ? (
              <div>{children}</div>
            ) : (
              <>
                <div className="mt-8">Think something should be here?</div>
                <div>
                  Reach out at{" "}
                  <Link href="mailto:help@studiohmr.com">
                    help@studiohmr.com
                  </Link>
                  .
                </div>
              </>
            )}
          </div>
          <div className="absolute inset-0 -z-10 flex select-none items-center justify-center font-bold font-heading text-8xl uppercase opacity-5">
            Not
            <br />
            Found
          </div>
        </div>
      </div>
    </div>
  );
};
