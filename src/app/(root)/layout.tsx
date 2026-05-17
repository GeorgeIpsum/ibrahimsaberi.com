import { HFPage } from "@/components/structure/hf-page";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
	return (
		<div className="mx-auto flex h-full w-full flex-col px-2 sm:px-6 lg:max-w-4xl">
			<HFPage>{children}</HFPage>
		</div>
	);
}
