import dota2Image from "@public/img/pages/tots/dota2.svg";
import macosImage from "@public/img/pages/tots/macos.svg";
import nixosImage from "@public/img/pages/tots/nixos.svg";
import { Link } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { cn } from "@/css/lib";
import type { ToolGroupOpts, Tool as ToolKind } from "../types";

const NixOs = () => (
  <div className="rounded-full border border-border bg-white p-0.5">
    <Image
      className="rounded-full border border-border bg-white"
      src={nixosImage}
      alt="nixos"
      width={16}
      height={16}
    />
  </div>
);
const MacOs = () => (
  <Image
    className="rounded-full border border-border bg-white"
    src={macosImage}
    alt="macos"
    width={22}
    height={22}
  />
);

const WindowsOs = () => (
  <Image className="" src={dota2Image} alt="windows" width={22} height={22} />
);

const platformIcon = {
  nixos: <NixOs />,
  macos: <MacOs />,
  windows: <WindowsOs />,
  ios: null,
};

export const Tool: React.FC<{ tool: ToolKind; opts: ToolGroupOpts }> = ({
  tool,
  opts,
}) => {
  const baseSize = opts.size === "small" ? 18 : 28;

  const renderPlatform = () => {
    if (!tool.platform) return null;
    if (Array.isArray(tool.platform)) {
      return (
        <div className="flex items-center justify-end rounded-full bg-background p-1 *:-ml-2">
          {tool.platform.map((platform) => platformIcon[platform])}
        </div>
      );
    }
    return tool.platform in platformIcon ? (
      <div className="flex items-center justify-end gap-1 rounded-full bg-background p-1">
        {platformIcon[tool.platform]}
      </div>
    ) : null;
  };

  return (
    <div className="h-40 w-full rounded-lg border border-border bg-card p-4 text-card-foreground md:h-36">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-baseline justify-start gap-2">
          <h3 className={cn("text-base", opts.classNames?.name)}>
            {tool.name}
          </h3>
          {tool.link && (
            <a href={tool.link} target="_blank" rel="noopener noreferrer">
              <Link
                className="size-3 text-muted-foreground"
                aria-label={`Link to ${tool.name}`}
              />
            </a>
          )}
        </div>
        <div className="flex items-center justify-end gap-x-1.5">
          {renderPlatform()}
          {tool.image && (
            <div
              className={cn(
                "flex items-center justify-center",
                tool.image.containerClassName,
              )}
            >
              <Image
                src={tool.image.src}
                alt={tool.name}
                width={tool.image.size ?? baseSize}
                height={tool.image.size ?? baseSize}
                className={cn("aspect-square object-fit", tool.image.className)}
              />
            </div>
          )}
        </div>
      </div>
      <ScrollArea className="h-20">
        <p
          className={cn(
            "text-muted-foreground",
            opts.size === "small" ? "text-xs" : "text-sm",
          )}
        >
          {tool.description}
        </p>
      </ScrollArea>
    </div>
  );
};
