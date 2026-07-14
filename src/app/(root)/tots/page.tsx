import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { Title } from "@/components/structure/title";
import { ToolGroup } from "./{lib}/components/tool-group";
import { ToolsOfThe } from "./{lib}/components/trade";
import { toolGroups } from "./{lib}/tool-groups";
export default async function Page() {
  return (
    <div className="flex flex-col gap-8">
      <Title>tools of the {<ToolsOfThe />}</Title>
      {toolGroups.map((group) => (
        <ToolGroup key={group.name} group={group} />
      ))}
    </div>
  );
}

export const metadata: Metadata = {
  title: "tools of the ?",
  description: "a list of tools i use and love.",
};
