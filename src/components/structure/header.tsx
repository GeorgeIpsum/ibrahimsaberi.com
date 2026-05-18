import Image from "next/image";
import Link from "next/link";
import { AudioWaveform } from "@/atoms/audio-waveform";
import {
	PreviewCard,
	PreviewCardPopup,
	PreviewCardTrigger,
} from "@/atoms/preview-card";
import { RefreshTicker } from "@/components/navigation/refresh-ticker";
import { cn } from "@/css/lib";
import { getNowPlayingSSR, Listening } from "@/services/spotify/listening";

export const Header: React.FC = async () => {
	const nowPlaying = (await getNowPlayingSSR())?.isPlaying;

	return (
		<header className="sticky top-2 h-12 w-full">
			<RefreshTicker intervalMs={15000} />
			<div className="flex w-full items-center rounded-xl border-accent border-b bg-white/20 p-2 backdrop-blur dark:bg-black/20">
				<div className="flex items-center gap-2">
					<Link rel="home" href="/">
						<Image
							className="size-7"
							loading="eager"
							src="/is.svg"
							alt="Logo"
							width={28}
							height={28}
						/>
					</Link>
					<Link rel="home" href="/">
						<span className="group/title text-sm leading-none tracking-tighter">
							<span className="leading-none opacity-75 duration-500 ease-in-out group-hover/title:opacity-40">
								a whisper.
							</span>{" "}
							<span className="inline-block whitespace-pre">
								{Array.from("a wave").map((ch, i) => (
									<span
										key={ch + i.toString()}
										className="inline-block origin-bottom leading-none group-hover/title:animate-wave-travel"
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
				<div className="flex w-full flex-1 items-center justify-end gap-6">
					<nav className="flex w-full flex-1 items-center justify-end">
						<ul className="flex w-full items-center justify-end gap-2 text-sm">
							<li>
								<Link href="/basin">basin</Link>
							</li>
							<li>
								<Link href="/mrcl">spin</Link>
							</li>
							<li>
								<Link className="uppercase" href="/wkur">
									wkur
								</Link>
							</li>
						</ul>
					</nav>
					<div
						className={cn("rounded-full border p-1", {
							"border-accent text-muted-foreground": !nowPlaying,
							"border-primary/90 text-primary/90": nowPlaying,
						})}
					>
						<PreviewCard>
							<PreviewCardTrigger>
								<AudioWaveform size={16} playing={!!nowPlaying} />
							</PreviewCardTrigger>
							<PreviewCardPopup className="w-80" align="end" sideOffset={12}>
								<Listening />
							</PreviewCardPopup>
						</PreviewCard>
					</div>
				</div>
			</div>
		</header>
	);
};
