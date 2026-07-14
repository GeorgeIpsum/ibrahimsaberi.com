import type { StaticImageData } from "next/image";

// overtyped garbage.
export type OS = "nixos" | "macos" | "windows" | "ios";
export type Tool<T extends string = string> = {
  name: T;
  description: string;
  image?: {
    src: StaticImageData;
    containerClassName?: string;
    className?: string;
    size?: number;
  };
  years?: [number, number];
  link?: string;
  underTheFold?: true;
} & (
  | { evaluating?: true }
  | {
      lookingForReplacement?: true;
      evaluating?: Pick<Tool<T>, "name" | "description" | "link" | "image">[];
    }
) &
  (
    | {
        platform?: OS | OS[];
      }
    | {
        platform: OS;
        alternatives: Pick<
          Omit<Tool<T>, "alternatives">,
          "name" | "description" | "link" | "platform" | "image"
        >[];
      }
  );

export interface ToolGroup<T extends string = string> {
  name: string;
  description: string;
  icon: React.ReactNode;
  tools: Tool<T>[];
  size?: "small" | "medium" | "large";
  classNames?: {
    name?: string;
    description?: string;
  };
}

export type ToolGroupOpts = Pick<
  ToolGroup,
  "name" | "description" | "icon" | "size" | "classNames"
>;
