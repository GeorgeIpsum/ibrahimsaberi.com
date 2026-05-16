"use client";

import { MoonStar, Sun, SunMoon } from "lucide-react";
import { Button } from "@/atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/atoms/popover";
import { ToggleGroup, ToggleGroupItem } from "@/atoms/toggle-group";
import type { Theme } from "./types";
import { useTheme } from "./use-theme";

interface ThemeButtonProps {
	side?: React.ComponentProps<typeof PopoverContent>["side"];
	align?: React.ComponentProps<typeof PopoverContent>["align"];
}
export const ThemeButton: React.FC<ThemeButtonProps> = ({ side, align }) => {
	const { theme, setTheme } = useTheme();

	return (
		<Popover>
			<PopoverTrigger render={<Button variant="ghost" />}>
				<SunMoon />
			</PopoverTrigger>
			<PopoverContent side={side} align={align}>
				<ToggleGroup
					orientation="vertical"
					defaultValue={[theme]}
					value={[theme]}
					onValueChange={([value]) => setTheme(value as Theme)}
				>
					<ToggleGroupItem aria-label="Light Theme" value="light">
						<Sun />
					</ToggleGroupItem>
					<ToggleGroupItem aria-label="Dark Theme" value="dark">
						<MoonStar />
					</ToggleGroupItem>
					<ToggleGroupItem
						aria-label="System Theme"
						value="system"
					></ToggleGroupItem>
				</ToggleGroup>
			</PopoverContent>
		</Popover>
	);
};
