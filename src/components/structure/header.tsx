import Image from "next/image";
import Link from "next/link";

export const Header: React.FC = () => {
	return (
		<header className="sticky top-2 h-12 w-full">
			<div className="flex w-full items-center rounded-xl border-accent border-b bg-white/20 p-2 backdrop-blur dark:bg-black/20">
				<div className="flex items-center gap-2">
					<Link rel="home" href="/">
						<Image
							className=""
							src="/is.svg"
							alt="Logo"
							width={28}
							height={28}
						/>
					</Link>
					<Link rel="home" href="/">
						<span className="group/title text-sm tracking-tighter">
							<span className="opacity-75 duration-500 ease-in-out group-hover/title:opacity-40">
								a whisper.
							</span>{" "}
							<span className="inline-block whitespace-pre">
								{Array.from("a wave").map((ch, i) => (
									<span
										key={ch + i.toString()}
										className="inline-block origin-bottom group-hover/title:animate-wave-travel"
										style={{ animationDelay: `${i * 70}ms` }}
									>
										{ch}
									</span>
								))}
								.
							</span>
						</span>
					</Link>
				</div>
				<div className="flex w-full flex-1 items-center justify-end gap-4">
					<nav className="flex w-full flex-1 items-center justify-end">
						<ul className="flex w-full items-center justify-end gap-2">
							<li>
								<Link href="/basin">basin</Link>
							</li>
							<li>
								<Link href="/miracle">mir</Link>
							</li>
						</ul>
					</nav>
					<div>listening:</div>
				</div>
			</div>
		</header>
	);
};
