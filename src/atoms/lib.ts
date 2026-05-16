import { cx } from "cva";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof cx>) {
	return twMerge(cx(inputs));
}
