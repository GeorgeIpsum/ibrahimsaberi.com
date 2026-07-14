import { createElement } from "react";
import { cn } from "@/css/lib";
import { type InlineNode, parseInline } from "./parser";

type InlineNodeType = InlineNode["type"];
type InlineNodeProps<T extends InlineNodeType> = Omit<
  Extract<InlineNode, { type: T }>,
  "type"
> & {
  className?: string;
  opts?: {
    textAs?: React.ElementType;
  };
};

const Text: React.FC<InlineNodeProps<"text">> = ({
  value,
  opts,
  className,
}) => {
  if (opts?.textAs)
    // biome-ignore lint/correctness/noChildrenProp: no i dont think i will :)
    return createElement(opts.textAs, { children: value, className });

  return <p className={className}>{value}</p>;
};

const Strong: React.FC<InlineNodeProps<"strong">> = ({
  children,
  className,
  opts,
}) => {
  return <strong className={className}>{renderInline(children, opts)}</strong>;
};

const Emphasis: React.FC<InlineNodeProps<"em">> = ({
  children,
  className,
  opts,
}) => {
  return <em className={className}>{renderInline(children, opts)}</em>;
};

const Del: React.FC<InlineNodeProps<"del">> = ({
  children,
  className,
  opts,
}) => {
  return <del className={className}>{renderInline(children, opts)}</del>;
};

const Code: React.FC<InlineNodeProps<"code">> = ({ value, className }) => {
  return <code className={className}>{value}</code>;
};

const Link: React.FC<InlineNodeProps<"link">> = ({
  href,
  children,
  className,
  opts,
}) => {
  return (
    <a href={href} className={cn("underline", className)}>
      {renderInline(children, opts)}
    </a>
  );
};

const Break: React.FC<InlineNodeProps<"break">> = ({ className }) => {
  return <br className={className} />;
};

export const renderInline = (
  input: string | InlineNode[],
  opts?: {
    textAs?: React.ElementType;
  },
): React.ReactElement => {
  const nodes = typeof input === "string" ? parseInline(input) : input;

  const elements = nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return <Text key={index.toString()} opts={opts} value={node.value} />;
      case "strong":
        return (
          <Strong key={index.toString()} opts={opts}>
            {node.children}
          </Strong>
        );
      case "em":
        return (
          <Emphasis key={index.toString()} opts={opts}>
            {node.children}
          </Emphasis>
        );
      case "del":
        return (
          <Del key={index.toString()} opts={opts}>
            {node.children}
          </Del>
        );
      case "code":
        return <Code key={index.toString()} value={node.value} />;
      case "link":
        return (
          <Link key={index.toString()} href={node.href} opts={opts}>
            {node.children}
          </Link>
        );
      case "break":
        return <Break key={index.toString()} />;
      default:
        return null;
    }
  });

  return <>{elements}</>;
};
