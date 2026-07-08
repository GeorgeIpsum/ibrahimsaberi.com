import YAML from "yamljs";
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

export const loadHero = (_hero_path: string) => {};

export const loadHeroSkills = (_hero_path: string) => {};

export const loadHeroSprites = (_hero_path: string) => {};
