"use client";

import Cli from "./Cli";
import Close from "./Close";
import Display from "./Display";
import Shell from "./Shell";

interface CrashProps {
  listen?: boolean;
}
const Crash: React.FC<CrashProps> = ({ listen = true }) => {
  return (
    <>
      <Shell>
        <Display listen={listen} />
        <Cli />
        <Close />
      </Shell>
    </>
  );
};

export default Crash;
