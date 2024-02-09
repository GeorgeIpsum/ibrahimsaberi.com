import { headers } from "next/headers";

import Cli from "./Cli";
import Display from "./Display";

const Crash: React.FC = () => {
  const ua = headers().get("user-agent");
  const platform = ua?.toUpperCase().includes("MAC") ? "Mac" : "Windows";

  return (
    <div className="crash fixed bottom-0 right-0 z-40 flex w-full flex-col justify-end bg-zinc-50/40 px-2 dark:bg-slate-950/30 sm:mx-6 sm:w-[300px] sm:rounded-t-xl md:mx-2 lg:top-0 lg:mx-0 lg:w-[400px]">
      <Display />
      <Cli platform={platform} />
      <div className="absolute -top-4 right-0 mx-3 flex h-4 w-12 select-none items-center justify-center rounded-t bg-pink-200 shadow shadow-fuchsia-800/30 dark:bg-green-950 dark:shadow-black/40 lg:-left-7 lg:bottom-12 lg:right-[unset] lg:top-[unset] lg:h-12 lg:w-4 lg:rounded-l lg:rounded-tr-none">
        <input type="checkbox" data-checkbox="arrow" />
      </div>
    </div>
  );
};

export default Crash;
