import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { PageTitle } from "@/components/structure/title";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { ASCII_SPIRAL_SUN } from "@/utils/ascii";
import { ToolGroup } from "./{lib}/components/tool-group";
import { ToolsOfThe } from "./{lib}/components/trade";
import { toolGroups } from "./{lib}/tool-groups";

export default async function Page() {
  return (
    <div className="flex flex-col gap-8">
      <PageTitle
        art={{
          ascii: ASCII_SPIRAL_SUN,
          anchor: "top-left",
          offset: { x: 0, y: -3 },
          color: "--destructive-foreground",
        }}
      >
        tools of the {<ToolsOfThe />}
      </PageTitle>
      {toolGroups.map((group) => (
        <ToolGroup key={group.name} group={group} />
      ))}
    </div>
  );
}

export const metadata: Metadata = {
  title: "tools of the ?",
  description: "a list of tools i use and love.",
  openGraph: generateOgMetadata("tots", "tools of the ?"),
};
