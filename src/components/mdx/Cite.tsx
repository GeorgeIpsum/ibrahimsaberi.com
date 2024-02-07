import Link from "next/link";

interface CiteProps {
  href?: string;
}
const Cite: React.FC<React.PropsWithChildren<CiteProps>> = ({
  href,
  children,
}) => {
  return (
    <p className="pb-4">
      <cite className="float-right -mt-8 text-[1.1rem]">
        {href ? <Link href={href}>{children}</Link> : children}
      </cite>
    </p>
  );
};

export default Cite;
