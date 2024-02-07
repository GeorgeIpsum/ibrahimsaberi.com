import Link from "next/link";

import { Worse } from "../svg";

const Logo: React.FC = () => {
  return (
    <Link
      href="/"
      className="-my-3 flex items-center py-3 font-head text-2xl font-medium sm:text-4xl"
      title="with feeling"
    >
      <Worse size={36} className="h-[28px] w-[28px] sm:h-[36px] sm:w-[36px]" />
      <div className="-ml-2">once more</div>
    </Link>
  );
};

export default Logo;
