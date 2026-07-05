import { type } from "arktype";

const baseStat = type("0 < number < 16");

export const stat = type({
  vit: baseStat,
  flx: baseStat,
  def: baseStat,
  pow: baseStat,
  ins: baseStat,
  spd: baseStat,
});

export const statKind = stat.keyof();

const baseStatGrowth = type(["0 < number < 3", "0 < number < 3"]);

export const statGrowth = stat.map((entry) => {
  return {
    key: entry.key,
    value: baseStatGrowth,
  };
});
