const { resolve } = require("node:path");
const { readdirSync } = require("node:fs");
const { program } = require("commander");

const thisFilePath = resolve(__dirname, __filename);
const thisDirContents = readdirSync(__dirname);

const scripts = [];
thisDirContents.forEach(file => {
  const filePath = resolve(__dirname, file);
  if(filePath !== thisFilePath) {
    try {
      const modulePath = require.resolve(filePath);
      if(modulePath) {
        const module = require(filePath);
        if(module && module.main && typeof module.main === "function") {
          scripts.push(module);
        }
      }
    } catch {}
  }
});

scripts.forEach(({ meta: { command, description, args, opts }, main }) => {
  const cmd = program
    .command(command)
    .description(description);
  
  if(args && args.length) {
    args.length.reduce((cmd, arg) => cmd.addArgument(...arg), cmd);
  }
  
  if(opts && opts.length) {
    opts.length.reduce((cmd, opt) => cmd.addOption(...opt), cmd)
  }
  
  cmd.action(main);
});

if(program.commands.length) {
  program
    .name("ibrahimsaberi.com Helper Scripts")
    .description("Some basic stuff for housekeeping and auto-generation")
    .version("1.0.0");
  program.parse();
}