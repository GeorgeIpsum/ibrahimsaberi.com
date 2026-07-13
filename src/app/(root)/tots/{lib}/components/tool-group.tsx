import { cn } from "@/css/lib";
import type { ToolGroup as ToolGroupKind, Tool as ToolKind } from "../types";
import { Tool } from "./tool";
import { UnderTheFold } from "./under-the-fold";

export const ToolGroup: React.FC<{ group: ToolGroupKind }> = ({ group }) => {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex h-5 items-end gap-2 text-xl">
        <span className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-primary via-primary to-secondary text-background *:[svg]:size-4">
          {group.icon}
        </span>
        <span>{group.name}</span>
      </h2>
      <p className="text-muted-foreground text-sm">{group.description}</p>
      <div className="py-2">
        <ToolGroupContent group={group} />
      </div>
    </section>
  );
};

const gridCols = {
  small: "grid-cols-2 md:grid-cols-3",
  medium: "grid-cols-1 md:grid-cols-2",
  large: "grid-cols-1",
};
const ToolGroupContent: React.FC<{ group: ToolGroupKind }> = ({ group }) => {
  const gridClass = gridCols[group.size ?? "medium"];
  const [aboveTheFold, underTheFold] = group.tools.reduce(
    (acc, curr) => {
      acc[curr.underTheFold ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as [ToolKind[], ToolKind[]],
  );

  const { tools, ...opts } = group;

  return (
    <div
      className={cn(
        "grid items-center justify-center gap-4 align-middle text-sm",
        gridClass,
      )}
    >
      {aboveTheFold.map((tool) => (
        <Tool key={tool.name} tool={tool} opts={opts} />
      ))}
      <UnderTheFold tools={underTheFold} opts={opts} />
    </div>
  );
};
