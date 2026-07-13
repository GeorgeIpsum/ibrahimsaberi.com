import type { StaticImageData } from "next/image";

// overtyped garbage.
export type OS = "nixos" | "macos" | "windows" | "ios";
export type Tool<T extends string = string> = {
  name: T;
  description?: string;
  image?: StaticImageData;
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
  tools: Tool<T>[];
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  classNames?: {
    name?: string;
    description?: string;
    image?: string;
  };
}
