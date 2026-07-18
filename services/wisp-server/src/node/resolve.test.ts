import { describe, expect, it } from "vitest";
import { EgressBlockedError } from "../egress-guard";
import { resolveAndGuard } from "./resolve";

const lookupTo = (ips: string[]) => async () => ips;

describe("resolveAndGuard", () => {
  it("returns a literal public IP unchanged without lookup", async () => {
    expect(await resolveAndGuard("8.8.8.8", lookupTo(["should-not-be-used"]))).toBe(
      "8.8.8.8",
    );
  });

  it("rejects a literal internal IP", async () => {
    await expect(
      resolveAndGuard("169.254.169.254", lookupTo([])),
    ).rejects.toBeInstanceOf(EgressBlockedError);
  });

  it("resolves a hostname and pins to the resolved public IP", async () => {
    expect(
      await resolveAndGuard("example.com", lookupTo(["93.184.216.34"])),
    ).toBe("93.184.216.34");
  });

  it("rejects when a hostname resolves to an internal IP (rebinding defense)", async () => {
    await expect(
      resolveAndGuard("rebind.evil", lookupTo(["127.0.0.1"])),
    ).rejects.toBeInstanceOf(EgressBlockedError);
  });

  it("rejects when ANY resolved address is internal", async () => {
    await expect(
      resolveAndGuard("mixed.evil", lookupTo(["8.8.8.8", "10.0.0.1"])),
    ).rejects.toBeInstanceOf(EgressBlockedError);
  });

  it("rejects when resolution yields no addresses", async () => {
    await expect(
      resolveAndGuard("void.example", lookupTo([])),
    ).rejects.toBeInstanceOf(EgressBlockedError);
  });
});
