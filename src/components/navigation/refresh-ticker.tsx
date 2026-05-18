"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
	intervalMs: number;
	pauseWhenHidden?: boolean;
};

export function RefreshTicker({ intervalMs, pauseWhenHidden = true }: Props) {
	const router = useRouter();

	useEffect(() => {
		const tick = () => {
			console.log("RefreshTicker tick");
			router.refresh();
		};

		let id: ReturnType<typeof setInterval> | undefined;
		const start = () => {
			if (id) clearInterval(id);
			id = setInterval(tick, intervalMs);
		};
		const stop = () => {
			if (id) {
				clearInterval(id);
				id = undefined;
			}
		};

		start();

		if (!pauseWhenHidden) {
			return () => stop();
		}

		const handleVisibility = () => {
			if (document.hidden) {
				stop();
			} else {
				tick();
				start();
			}
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			stop();
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [router, intervalMs, pauseWhenHidden]);

	return null;
}
