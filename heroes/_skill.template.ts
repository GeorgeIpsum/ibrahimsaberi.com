import { type } from "arktype";
import { statKind } from "./_stat.template";

// name:        <STRING>
// type:        <active|passive>
// desc:        <STRING>
// unique?:     <BOOLEAN>                # if the skill is unique to the hero
// effect?:     <EXPR>
// power?:      <NUMBER>                 # skill power
// power_type?: <phys|magic|psych|mixed> # skill power type

// # if power_type is mixed, this is the mix of power types, must have at least 2
// power_type_mix?:
//   - <phys|magic|psych>
//   - <phys|magic|psych>

// cooldown?:   <NUMBER> # cooldown in seconds
// cost?:       <NUMBER|DELTA> # skill cost
// level_req?:  <NUMBER> # level requirement

// # optional list of upgrades that happen at x level
// level_upgrades?:
//   - level:            <NUMBER>
//     description?:     <STRING>
//     effect_change?:   <DELTA>
//     cost_change?:     <DELTA>
//     cooldown_change?: <DELTA>
//     power_change?:    <DELTA>

const operator = type(`"+" | "-" | "*" | "/"`);
const statDelta = type({
  stat: statKind,
  op: operator,
  value: "number",
});
const delta = type({
  op: operator,
  value: "number",
});

const singlePowerType = type(`"phys" | "magic" | "psych"`);
const skillPower = type({
  power: "number",
  power_type: singlePowerType,
  "power_type_mix?": "undefined",
}).or({
  power: "number",
  power_type: "'mixed'",
  power_type_mix: singlePowerType.array().atLeastLength(2),
});

const baseSkill = type({
  name: "string",
  type: `"active" | "passive"`,
  desc: "string",
  unique: "boolean?",
  cooldown: "number?",
  cost: "number?",
  level_req: "number?",
});

export const skill = baseSkill.and({});
export type Skill = typeof skill.infer;
