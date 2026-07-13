import { connection } from "next/server";
import { Suspense } from "react";
import { randomArrayMember } from "@/utils/rand";
import { toolsOfThe } from "../strings";

const _ToolsOfThe: React.FC = async () => {
  await connection();

  return <span>{randomArrayMember(toolsOfThe)}</span>;
};

export const ToolsOfThe: React.FC = () => {
  return (
    <Suspense fallback={<span></span>}>
      <_ToolsOfThe />
    </Suspense>
  );
};
