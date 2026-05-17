import { Footer, Header } from "@/components/structure";

// BOOGIE WOOGIE IS DEAD
// LONG LIVE BOOGIE WOOGIE

export default function Layout({ children }: React.PropsWithChildren) {
	return (
		<div className="mx-auto w-full px-2 sm:px-6 lg:max-w-4xl flex flex-col h-full">
			<Header />
			<main className="py-4 flex-1">{children}</main>
			<Footer />
		</div>
	);
}
