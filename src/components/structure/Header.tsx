import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-[999] w-full bg-pink-100/50 backdrop-blur dark:bg-emerald-950/20">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center px-4 py-3">
          <Link
            href="/"
            className=" font-head text-xl font-medium text-rose-800 dark:text-emerald-50"
          >
            Once More
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
