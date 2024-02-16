const { readFileSync, readdirSync, writeFileSync, statSync } = require("node:fs");
const { resolve } = require("node:path");

const solveFileImports = (path, dir, dirContents) => {
  const imports = [];
  dirContents.forEach(fileName => {
    if(fileName !== "index.ts") {
      const fileImport = { defaultExport: null, vars: [], name: fileName };
      const fileContents = readFileSync(resolve(dir, fileName), "utf-8");
      const byLine = fileContents.split("\n");
      byLine.forEach(line => {
        const l = line.trim();
        if(l.indexOf("export default") === 0) {
          fileImport.defaultExport = l.split(" ")[2].replace(";", "");
        } else if (l.indexOf("export") === 0) {
          const split = l.split(" ");
          const exportToken = split[1] === "const" || "let" || "var" || "function" ? split[2] : split[1];
          fileImport.vars.push(exportToken.replace(";", ""));
        }
      });
      
      if(fileImport.defaultExport || fileImport.vars.length) imports.push(fileImport);
    }
  });
  
  // construct new index.ts
  const header = "// [auto-parse-please]";
  const indexImports = imports.map(
    ({ vars, name, defaultExport }) => 
    {
      const defaultExportText = !!defaultExport ? `${defaultExport}${!!vars.length ? ", " : ""}` : "";
      const varsText = !!vars.length ? `{ ${vars.join(", ")} }` : "";
      const nameSplit = name.split(".");
      const nameNoExt = nameSplit.slice(0, nameSplit.length - 1).join(".");
      return `import ${defaultExportText}${varsText} from "./${nameNoExt}";`
    }
  );
  
  const indexExports = imports.map(
    ({ vars, defaultExport }) => 
    {
      const defaultExportText = !!defaultExport ? `${defaultExport},` : "";
      const varsText = !!vars.length ? `${vars.join(",\n")}` : "";
      return `${defaultExportText}${varsText}`;
    }
  );
  
  // put it together
  const newIndexFile = [header, ...indexImports, `\nexport {\n${indexExports.map(e => `  ${e}`).join("\n")}\n}`].join("\n");
  
  writeFileSync(path, newIndexFile, "utf-8")
};

const solveFile = (file, path, dir, dirContents) => {
  const fileContents = readFileSync(path, "utf-8");
  if(file === "index.ts" && fileContents.indexOf("// [auto-parse-please]") === 0) {
    return solveFileImports(path, dir, dirContents);
  }
}

const recurseDir = (dir) => {
  const dirContents = readdirSync(dir);
  dirContents.sort((fileA, fileB) => fileA === "index.ts" ? -1 : fileB === "index.ts" ? 1 : 0);
  
  return dirContents.map((file, index) => {
    const path = resolve(dir, file);
    const stat = statSync(path);
    if(stat.isDirectory()) {
      return recurseDir(path);
    } else if(stat.isFile()) {
      return solveFile(file, path, dir, dirContents);
    }
  });
}

function main() {
  const srcDirPath = resolve(__dirname, "..", "src");
  return recurseDir(srcDirPath);
}

module.exports = {
  main,
  meta: {
    command: "parse-indices",
    description: "Auto import and re-export index.ts dependencies",
    opts: [],
    args: [],
  },
};