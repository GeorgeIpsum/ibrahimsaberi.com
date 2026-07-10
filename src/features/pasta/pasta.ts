import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as ASCII_PASTA from "@/utils/ascii";

const copypastaDir = path.join(process.cwd(), "src/features/pasta/sauce");

export const copypasta = [
  ...readdirSync(copypastaDir)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => ({
      title: file,
      content: readFileSync(path.join(copypastaDir, file), "utf8"),
    })),
  ...Object.entries(ASCII_PASTA).map(([title, content]) => ({
    title: `${title}.txt`,
    content,
  })),
];

export const allSauce = copypasta.map((p) => p.title.replace(".txt", ""));
