import Image from "next/image";
import Link from "next/link";

const Better: React.FC = () => {
  return (
    <Link href="/" title="To Home">
      <Image src="/img/icon.svg" alt="better" width={5120} height={5120} />
    </Link>
  );
};

export default Better;
