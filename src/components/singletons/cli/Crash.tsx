import Cli from "./Cli";
import Display from "./Display";

const Crash: React.FC = () => {
  return (
    <div className="crash fixed bottom-0 right-0 flex w-full flex-col bg-zinc-50/40 px-2 dark:bg-slate-950/30 sm:mx-6 sm:w-auto sm:min-w-96 sm:rounded-t-xl md:mx-0 lg:relative lg:ml-auto lg:h-[calc(100vh)] lg:w-[400px]">
      <Display />
      <Cli />
      <div className="absolute -top-4 right-0 mx-3 flex h-4 w-12 select-none items-center justify-center rounded-t bg-pink-200 shadow shadow-fuchsia-800/30 dark:bg-green-950 dark:shadow-black/40 lg:-left-7 lg:bottom-12 lg:right-[unset] lg:top-[unset] lg:h-12 lg:w-4 lg:rounded-l lg:rounded-tr-none">
        <input className="arrow" type="checkbox" />
      </div>
    </div>
  );
};

export default Crash;
