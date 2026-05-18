import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { program } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @typedef {Object} ScriptMeta
 * @property {string} command
 * @property {string} [description]
 * @property {import("commander").Argument[]} [args]
 * @property {import("commander").Option[]} [opts]
 */

/**
 * @typedef {Object} Script
 * @property {(...args: unknown[]) => void | Promise<void>} main
 * @property {ScriptMeta} meta
 */

const dirContents = await readdir(__dirname);

/** @type {Script[]} */
const scripts = [];
for (const file of dirContents) {
	const filePath = resolve(__dirname, file);
	if (filePath === __filename) continue;
	if (!file.endsWith(".js")) continue;
	try {
		const mod = await import(pathToFileURL(filePath).href);
		/** @type {Script | undefined} */
		const exported = mod.default ?? mod;
		if (exported?.main && typeof exported.main === "function") {
			scripts.push(exported);
		}
	} catch (e) {
		console.log(e);
	}
}

for (const {
	meta: { command, description, args, opts },
	main,
} of scripts) {
	const cmd = program.command(command);

	if (description) {
		cmd.description(description);
	}

	if (args?.length) {
		args.reduce((c, arg) => c.addArgument(arg), cmd);
	}

	if (opts?.length) {
		opts.reduce((c, opt) => c.addOption(opt), cmd);
	}

	cmd.action(main);
}

if (program.commands.length) {
	program
		.name("ibrahimsaberi.com Helper Scripts")
		.description("Some basic stuff for housekeeping and auto-generation")
		.version("1.0.0");
	program.parse();
}
