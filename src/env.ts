import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

export const env = createEnv({
	server: {
		SPOTIFY_CLIENT_ID: type("string > 0"),
		SPOTIFY_CLIENT_SECRET: type("string > 0"),
		SPOTIFY_REFRESH_TOKEN: type("string > 0"),
	},
	client: {},
	runtimeEnv: {
		SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
		SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
		SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN,
	},
	emptyStringAsUndefined: true,
});
