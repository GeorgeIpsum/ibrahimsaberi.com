import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { Theme } from "./types";

export const getSystemThemeRSC = cache(async (): Promise<Theme> => {
	const themeCookie = (await cookies()).get("theme")?.value;
	if (themeCookie === "light" || themeCookie === "dark") {
		return themeCookie;
	}

	const defaultTheme = (await headers()).get("Sec-CH-Prefers-Color-Scheme");
	if (defaultTheme === "light" || defaultTheme === "dark") {
		return defaultTheme as Theme;
	}

	return "system";
});
