import type React from "react";
import { ThemeButton } from "@/theme/theme-button";

export const Footer: React.FC = () => {
	return (
		<footer className="flex items-center justify-end gap-4 py-4 mt-24">
			<ThemeButton side="top" align="end" />
		</footer>
	);
};
