import type React from "react";
import { Separator } from "@/atoms/separator";
import { ThemeButton } from "@/theme/theme-button";

export const Footer: React.FC = () => {
	return (
		<footer className="mt-24 w-full">
			<Separator orientation="horizontal" />
			<div className="flex w-full items-center justify-end gap-4 py-4">
				<ThemeButton side="top" align="end" />
			</div>
		</footer>
	);
};
