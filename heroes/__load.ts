import YAML from "yamljs";
import { hero } from "./_hero.template";
import { skill } from "./_skill.template";

export const loadCommonSkills = () => {
  const skills = YAML.load("./heroes/common.skills") as unknown[];
  if (!Array.isArray(skills)) {
    throw new Error("Invalid common skills file: expected an array of skills");
  }
  return skills.filter((s) => {
    const allowed = skill.allows(s);
    if (!allowed) {
      console.warn("Invalid skill found in common skills file:", s, skill(s));
    }
    return allowed;
  });
};

export const loadHero = (hero_path: string) => {};

export const loadHeroSkills = (hero_path: string) => {};

export const loadHeroSprites = (hero_path: string) => {};
