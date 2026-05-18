"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface HistoryContextValue {
	entries: string[];
}
const HistoryContext = createContext<HistoryContextValue | undefined>(
	undefined,
);

export const useHistory = (): HistoryContextValue => {
	const context = useContext(HistoryContext);
	if (!context) {
		throw new Error("useHistory must be used within a HistoryProvider");
	}
	return context;
};

export const HistoryProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const [history, setHistory] = useState<string[]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: no infinite loop pls
	useEffect(() => {
		// console.log("history updated", history);
		if (window.location.pathname !== history[history.length - 1])
			setHistory((prev) => [...prev, window.location.pathname]);
	}, [typeof window === "undefined" ? undefined : window.location.pathname]);

	return (
		<HistoryContext.Provider value={{ entries: history }}>
			{children}
		</HistoryContext.Provider>
	);
};
