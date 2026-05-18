import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import http from "node:http";
import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const REDIRECT_HOST = "127.0.0.1";
const REDIRECT_PORT = 8888;
const REDIRECT_URI = `http://${REDIRECT_HOST}:${REDIRECT_PORT}/callback`;
const SCOPES = ["user-read-currently-playing", "user-read-recently-played"];

async function main() {
	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error(
			"\n  Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.\n" +
				"  Run with: node --env-file=.env .scripts/index.js spotify-token\n",
		);
		process.exit(1);
	}

	const state = randomBytes(16).toString("hex");
	const authUrl =
		"https://accounts.spotify.com/authorize?" +
		new URLSearchParams({
			client_id: clientId,
			response_type: "code",
			redirect_uri: REDIRECT_URI,
			scope: SCOPES.join(" "),
			state,
		}).toString();

	const refreshToken = await new Promise((resolve, reject) => {
		const server = http.createServer(async (req, res) => {
			const url = new URL(req.url || "/", REDIRECT_URI);
			if (url.pathname !== "/callback") {
				res.writeHead(404).end();
				return;
			}

			const code = url.searchParams.get("code");
			const returnedState = url.searchParams.get("state");
			const error = url.searchParams.get("error");

			if (error) {
				res
					.writeHead(400, { "Content-Type": "text/html" })
					.end(`<h1>Authorization failed</h1><p>${error}</p>`);
				server.close();
				reject(new Error(`Spotify returned error: ${error}`));
				return;
			}

			if (!code || returnedState !== state) {
				res
					.writeHead(400, { "Content-Type": "text/html" })
					.end("<h1>Bad request</h1>");
				server.close();
				reject(new Error("Missing code or state mismatch"));
				return;
			}

			try {
				const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
					method: "POST",
					headers: {
						Authorization: `Basic ${Buffer.from(
							`${clientId}:${clientSecret}`,
						).toString("base64")}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						grant_type: "authorization_code",
						code,
						redirect_uri: REDIRECT_URI,
					}),
				});

				if (!tokenRes.ok) {
					const text = await tokenRes.text();
					throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
				}

				const data = /** @type {{ refresh_token: string }} */ (
					await tokenRes.json()
				);
				res
					.writeHead(200, { "Content-Type": "text/html" })
					.end(
						"<h1>Done.</h1><p>You can close this tab. Refresh token printed to terminal.</p>",
					);
				server.close();
				resolve(data.refresh_token);
			} catch (e) {
				res
					.writeHead(500, { "Content-Type": "text/html" })
					.end("<h1>Server error</h1>");
				server.close();
				reject(e);
			}
		});

		server.listen(REDIRECT_PORT, REDIRECT_HOST, () => {
			console.log(`\n  Listening on ${REDIRECT_URI}`);
			console.log("  Opening browser for Spotify authorization...\n");
			spawn("open", [authUrl], { stdio: "ignore", detached: true }).unref();
		});

		server.on("error", reject);
	});

	console.log("\n  Success. Add this to your .env:\n");
	console.log(`  SPOTIFY_REFRESH_TOKEN="${refreshToken}"\n`);
	process.exit(0);
}

export default {
	main,
	meta: {
		command: "spotify-token",
		description:
			"Run a one-time OAuth flow against Spotify to obtain a refresh token. Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env. The Spotify app must allow http://127.0.0.1:8888/callback as a redirect URI.",
		opts: [],
		args: [],
	},
};
