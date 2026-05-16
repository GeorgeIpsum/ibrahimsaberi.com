"use client";

import { SunMoon } from "lucide-react";
import { Button } from "@/atoms/button";
import { getSystemTheme } from "./get-system-theme";
import { useTheme } from "./use-theme";

export const ThemeButton: React.FC = () => {
	const { theme, setTheme } = useTheme();

	return (
		<Button variant="ghost">
			<SunMoon />
		</Button>
	);
};
