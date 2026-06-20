/// <reference lib="webworker" />
import { SabResponder } from "../bridge/sab";

declare const self: DedicatedWorkerGlobalScope;

let responder: SabResponder | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    // Phase 1 ECHO: uppercase ASCII bytes to prove transforms round-trip.
    responder = new SabResponder(msg.sab as SharedArrayBuffer, (_op, payload) =>
      Uint8Array.from(payload, (b) => (b >= 97 && b <= 122 ? b - 32 : b)),
    );
    wakePort.onmessage = () => {
      void responder?.handle();
    };
  }
};
