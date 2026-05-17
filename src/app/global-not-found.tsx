// import { Container, Link } from "@/components/atoms";
import Link from "next/link";

// const GoBack = dynamic(() => import("@/components/navigation/GoBack"), {
//   ssr: false,
// });

import "./globals.css";

import { fontBody, fontHeading, fontMono } from "@/css/font";
import { cn } from "@/css/lib";
import { getSystemThemeRSC } from "@/theme/get-system-theme.server";

const NotFound: React.FC = async () => {
	const theme = await getSystemThemeRSC();

	return (
		<html
			lang="en"
			data-theme={theme}
			className={cn(fontBody.variable, fontHeading.variable, fontMono.variable)}
		>
			<body>
				<div className="fixed flex h-screen w-screen items-center justify-center">
					<div className="w-full px-6 md:mx-auto md:max-w-xl md:px-0">
						<div
							className="relative w-full px-4 py-16 text-center text-lg md:px-16"
							// padding="custom"
						>
							{/* <GoBack className="appear absolute left-0 top-0 h-auto text-rose-900 dark:text-teal-50" /> */}
							<h1 className="mb-4 font-semibold text-5xl">Hmmm...</h1>
							<div className="mb-4">Sorry, couldn&apos;t find that.</div>
							<div>Think something should be here?</div>
							<div>
								Reach out at{" "}
								<Link href="mailto:help@studiohmr.com">help@studiohmr.com</Link>
								.
							</div>
							<div className="absolute top-0 right-0 bottom-0 left-0 -z-10 flex select-none items-center justify-center font-bold font-head text-8xl uppercase opacity-5">
								Not
								<br />
								Found
							</div>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
};

export default NotFound;
