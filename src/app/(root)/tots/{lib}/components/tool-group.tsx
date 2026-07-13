import type { ToolGroup as ToolGroupType } from "../types";

export const ToolGroup: React.FC<{ group: ToolGroupType }> = ({ group }) => {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex h-5 items-end gap-2 text-xl">
        <span className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-primary via-primary to-secondary text-background *:[svg]:size-4">
          {group.icon}
        </span>
        <span>{group.name}</span>
      </h2>
    </section>
  );
};
