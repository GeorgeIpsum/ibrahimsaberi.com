import Cli from "./Cli";
import Display from "./Display";

const Crash: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex md:left-auto lg:mx-4">
      <Display />
      <Cli />
    </div>
  );
};

export default Crash;
