import { headers } from "next/headers";

import Cli from "./Cli";
import Close from "./Close";
import Display from "./Display";

const Crash: React.FC = () => {
  const ua = headers().get("user-agent");
  const platform = ua?.toUpperCase().includes("MAC") ? "Mac" : "Windows";

  return (
    <div className="crash fixed bottom-0 right-0 z-40 flex w-full flex-col justify-end bg-zinc-50/40 px-2 dark:bg-slate-950/30 sm:mx-6 sm:w-[300px] sm:rounded-t-xl md:mx-2 lg:top-0 lg:mx-0 lg:w-[400px]">
      <Display />
      <Cli platform={platform} />
      <Close />
    </div>
  );
};

export default Crash;
