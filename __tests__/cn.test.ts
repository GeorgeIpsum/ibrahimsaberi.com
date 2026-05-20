import { describe, expect, it } from "vitest";
import { cn } from "../src/css/lib";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-lg")).toBe("text-lg");
  });

  it("drops falsy and conditional entries", () => {
    expect(cn("flex", false, null, undefined, "gap-2")).toBe("flex gap-2");
    expect(cn("flex", true && "gap-2", false && "p-4")).toBe("flex gap-2");
  });

  it("flattens array inputs", () => {
    expect(cn(["flex", "gap-2"], "p-4")).toBe("flex gap-2 p-4");
  });

  it("returns an empty string when given no meaningful input", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
