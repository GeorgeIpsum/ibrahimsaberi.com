import Image from "next/image";
import Link from "next/link";

export const Header: React.FC = () => {
	return (
		<header className="sticky top-2 h-12 w-full lg:max-w-4xl">
			<div className="flex w-full items-center rounded-xl border-accent border-b bg-white/20 p-2 backdrop-blur dark:bg-black/20">
				<div className="flex items-center gap-2">
					<Link rel="home" href="/">
						<Image
							className=""
							src="/is.svg"
							alt="Logo"
							width={32}
							height={32}
						/>
					</Link>
					<Link rel="home" href="/">
						<span className="group/title text-sm tracking-tighter">
							<span className="opacity-75 duration-500 ease-in-out group-hover/title:opacity-40">
								a whisper.
							</span>{" "}
							<span className="inline-block origin-bottom duration-500 ease-in-out group-hover/title:animate-wave-distort">
								a wave.
							</span>
						</span>
					</Link>
				</div>
			</div>
		</header>
	);
};
