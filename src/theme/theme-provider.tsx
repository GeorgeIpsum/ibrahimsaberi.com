"use client";

import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useState,
} from "react";
import type { Theme } from "./types";

export const ThemeContext = createContext<
	{ theme: Theme; setTheme: (theme: Theme) => void } | undefined
>(undefined);

export const ThemeProvider: React.FC<
	PropsWithChildren<{ defaultTheme: Theme }>
> = ({ children, defaultTheme }) => {
	const [theme, _setTheme] = useState<Theme>(
		typeof document === "undefined"
			? defaultTheme
			: ((document.documentElement.dataset.theme as Theme) ?? defaultTheme),
	);

	const setTheme = useCallback((theme: Theme) => {
		document.documentElement.dataset.theme = theme;
		const cookieTheme = theme === "system" ? "" : theme;
		// biome-ignore lint/suspicious/noDocumentCookie: no cares
		document.cookie = `theme=${cookieTheme}; path=/; max-age=31536000; SameSite=Lax`;
		_setTheme(theme);
	}, []);

	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "data-theme"
				) {
					const newTheme = document.documentElement.dataset.theme as Theme;
					if (newTheme !== theme) {
						_setTheme(newTheme);
					}
				}
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
			childList: false,
		});
		return () => observer.disconnect();
	}, [theme]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
