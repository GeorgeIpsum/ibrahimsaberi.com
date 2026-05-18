import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} FileImport
 * @property {string | null} defaultExport
 * @property {string[]} vars
 * @property {string} name
 */

/** @type {import("ora").Ora | undefined} */
let spinner;

/**
 * @param {string} path
 * @param {string} dir
 * @param {string[]} dirContents
 */
const solveFileImports = (path, dir, dirContents) => {
	/** @type {FileImport[]} */
	const imports = [];
	dirContents.forEach((fileName) => {
		if (fileName !== "index.ts") {
			/** @type {FileImport} */
			const fileImport = { defaultExport: null, vars: [], name: fileName };
			const fileContents = readFileSync(resolve(dir, fileName), "utf-8");
			const byLine = fileContents.split("\n");
			byLine.forEach((line) => {
				const l = line.trim();
				if (l.indexOf("export default") === 0) {
					fileImport.defaultExport = l.split(" ")[2].replace(";", "");
				} else if (l.indexOf("export") === 0) {
					const split = l.split(" ");
					const exportToken =
						split[1] === "const" ||
						split[1] === "let" ||
						split[1] === "var" ||
						split[1] === "function"
							? split[2]
							: split[1];
					fileImport.vars.push(exportToken.replace(";", ""));
				}
			});

			if (fileImport.defaultExport || fileImport.vars.length)
				imports.push(fileImport);
		}
	});

	// construct new index.ts
	const header = "// [auto-parse-please]";
	const indexImports = imports.map(({ vars, name, defaultExport }) => {
		const defaultExportText = defaultExport
			? `${defaultExport}${vars.length ? ", " : ""}`
			: "";
		const varsText = vars.length ? `{ ${vars.join(", ")} }` : "";
		const nameSplit = name.split(".");
		const nameNoExt = nameSplit.slice(0, nameSplit.length - 1).join(".");
		return `import ${defaultExportText}${varsText} from "./${nameNoExt}";`;
	});

	const indexExports = imports.map(({ vars, defaultExport }) => {
		const defaultExportText = defaultExport ? `${defaultExport},` : "";
		const varsText = vars.length ? `${vars.join(",\n")}` : "";
		return `${defaultExportText}${varsText}`;
	});

	// put it together
	const newIndexFile = [
		header,
		...indexImports,
		`\nexport {\n${indexExports.map((e) => `  ${e}`).join("\n")}\n}`,
	].join("\n");

	writeFileSync(path, newIndexFile, "utf-8");
};

/**
 * @param {string} file
 * @param {string} path
 * @param {string} dir
 * @param {string[]} dirContents
 */
const solveFile = (file, path, dir, dirContents) => {
	const fileContents = readFileSync(path, "utf-8");
	if (
		file === "index.ts" &&
		fileContents.indexOf("// [auto-parse-please]") === 0
	) {
		if (spinner) spinner.text = `${path}`;
		return solveFileImports(path, dir, dirContents);
	}
};

/** @param {string} dir */
const recurseDir = (dir) => {
	const dirContents = readdirSync(dir);
	dirContents.sort((fileA, fileB) =>
		fileA === "index.ts" ? -1 : fileB === "index.ts" ? 1 : 0,
	);

	dirContents.forEach((file, _index) => {
		const path = resolve(dir, file);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			recurseDir(path);
		} else if (stat.isFile()) {
			solveFile(file, path, dir, dirContents);
		}
	});
};

async function main() {
	const ora = await import("ora");
	const s = ora.default();
	spinner = s;
	s.prefixText = "Parsing";
	s.start();
	const srcDirPath = resolve(__dirname, "..", "src");
	recurseDir(srcDirPath);
	s.text = "Running ESLint...";
	const eslintOutput = spawnSync("pnpm", ["run", "lint"]);
	s.prefixText = "";
	eslintOutput.output.forEach((output) => {
		if (output) s.text = output.toString("utf-8");
	});
	s.stop();
}

export default {
	main,
	meta: {
		command: "parse-indices",
		description: "Auto import and re-export index.ts dependencies",
		opts: [],
		args: [],
	},
};
