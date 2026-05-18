import type { MetadataRoute } from "next";
import { getSystemThemeRSC } from "@/theme/get-system-theme.server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const theme = await getSystemThemeRSC();

	const background_color = theme === "light" ? "#fdf6fe" : "#070b04";

	return {
		name: "A Whisper",
		short_name: "A Wave",
		description: "A basin sits alone atop the East bridge. It overflows.",
		start_url: "ibrahimsaberi.com",
		display: "standalone",
		background_color: background_color,
		theme_color: background_color,
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};
}
