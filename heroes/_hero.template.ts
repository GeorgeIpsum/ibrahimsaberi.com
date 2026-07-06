import { type } from "arktype";
import { skill } from "./_skill.template";
import { baseStats, statGrowth } from "./_stat.template";

export const hero = type({
  hero: "string",
  display_name: "string",
  sub_name: "string",
  faction: `"silver" | "gold" | "black"`,
  attr: `"mag" | "mek" | "bio" | "psy"`,
  base_stats: baseStats,
  stat_growth: statGrowth,
  skills: skill.array(),
});
export type Hero = typeof hero.infer;
