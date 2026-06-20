/// <reference lib="webworker" />
import { SabRequester } from "../bridge/sab";
import { OP } from "../client/protocol";
import { bootPyodide, type PyodideRuntime } from "./boot";
import type { PyodideBootConfig } from "./config";

declare const self: DedicatedWorkerGlobalScope;

let requester: SabRequester | undefined;
let runtime: Promise<PyodideRuntime> | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    requester = new SabRequester(msg.sab as SharedArrayBuffer, (reqId) =>
      wakePort.postMessage(reqId),
    );
    runtime = bootPyodide((msg.config ?? {}) as PyodideBootConfig, requester);
    runtime.then(
      (rt) =>
        self.postMessage({ type: "ready", ytDlpVersion: rt.ytDlpVersion }),
      (err) =>
        self.postMessage({ type: "boot-error", message: messageOf(err) }),
    );
  } else if (msg?.type === "ping" && requester) {
    // Direct (non-Python) bridge round-trip — does not require Pyodide.
    self.postMessage({
      type: "pong",
      text: requester.callText(OP.ECHO, msg.text),
    });
  } else if (msg?.type === "py-echo") {
    void handlePyEcho(msg.text as string);
  }
};

async function handlePyEcho(text: string): Promise<void> {
  try {
    const { pyodide } = await runtime!;
    pyodide.globals.set("_echo_in", text);
    const result = pyodide.runPython("echo(_echo_in)") as string;
    self.postMessage({ type: "py-echo-result", text: result });
  } catch (err) {
    self.postMessage({ type: "py-echo-result", error: messageOf(err) });
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
