import Cli from "./Cli";
import Display from "./Display";

const Crash: React.FC = () => {
  return (
    <div className="flex w-full">
      <Display />
      <Cli />
    </div>
  );
};

export default Crash;
