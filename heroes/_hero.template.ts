import { type } from "arktype";
import { stat, statGrowth } from "./_stat.template";

export const hero = type({
  hero: "string",
  display_name: "string",
  sub_name: "string",
  faction: `"silver" | "gold" | "black"`,
  attr: `"mag" | "mek" | "bio" | "psy"`,
  base_stats: stat,
  stat_growth: statGrowth,
  skills: stat.array(),
});
