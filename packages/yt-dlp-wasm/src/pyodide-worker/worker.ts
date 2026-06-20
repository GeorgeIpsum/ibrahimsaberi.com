/// <reference lib="webworker" />
import { SabRequester } from "../bridge/sab";
import { OP } from "../client/protocol";

declare const self: DedicatedWorkerGlobalScope;

let requester: SabRequester | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    requester = new SabRequester(msg.sab as SharedArrayBuffer, (reqId) =>
      wakePort.postMessage(reqId),
    );
  } else if (msg?.type === "ping" && requester) {
    // Blocks this worker thread on Atomics.wait until the responder answers.
    const text = requester.callText(OP.ECHO, msg.text);
    self.postMessage({ type: "pong", text });
  }
};
