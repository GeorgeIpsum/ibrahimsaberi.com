import Cli from "./Cli";
import Display from "./Display";

const Crash: React.FC = () => {
  return (
    <div className="fixed bottom-0 flex w-full flex-col bg-zinc-50/40 px-2 dark:bg-slate-950/10 sm:mx-4 sm:w-auto">
      <Display />
      <Cli />
    </div>
  );
};

export default Crash;
