import { type } from "arktype";

export const stats = type({
  vit: "number",
  flx: "number",
  def: "number",
  pow: "number",
  ins: "number",
  spd: "number",
});
export const statKind = stats.keyof();

const baseStat = type("0 < number < 16");
export const baseStats = stats.map((entry) => ({
  key: entry.key,
  value: baseStat,
}));

const baseStatGrowth = type(["0 < number < 3", "0 < number < 3"]);
export const statGrowth = stats.map((entry) => ({
  key: entry.key,
  value: baseStatGrowth,
}));
