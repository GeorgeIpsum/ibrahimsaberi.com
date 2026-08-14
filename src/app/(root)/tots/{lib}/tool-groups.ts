import { audioTools } from "./groups/audio";
import { botTools } from "./groups/bot";
import { cliTools } from "./groups/cli";
import { textEditorTools } from "./groups/editor";
import { infraTools } from "./groups/infra";
import { operatingSystemTools } from "./groups/os";
import { supportingTools } from "./groups/supporting";
import { termTools } from "./groups/term";

// i dont get why people will use objects and then Object.entries when order matters
export const toolGroups = [
  operatingSystemTools,
  termTools,
  textEditorTools,
  cliTools,
  botTools,
  infraTools,
  audioTools,
  supportingTools,
] as const;
