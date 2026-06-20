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
  } else if (msg?.type === "ffmpeg-self-test") {
    void handleFfmpegSelfTest(msg.wavBase64 as string);
  }
};

async function handleFfmpegSelfTest(wavBase64: string): Promise<void> {
  try {
    if (!runtime) throw new Error("ffmpeg-self-test before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_wav_b64", wavBase64);
    const result = pyodide.runPython(`
import base64, json, subprocess, os
with open("/tmp/in.wav", "wb") as _f:
    _f.write(base64.b64decode(_wav_b64))
_cp = subprocess.run(["ffmpeg", "-y", "-i", "/tmp/in.wav", "/tmp/out.mp3"])
_out_size = os.path.getsize("/tmp/out.mp3") if os.path.exists("/tmp/out.mp3") else 0
import ffprobe_compat
_code, _probe_json, _ = ffprobe_compat.run(["ffprobe", "/tmp/out.mp3"])
json.dumps({"code": _cp.returncode, "outSize": _out_size, "probe": _probe_json.decode()})
`) as string;
    self.postMessage({ type: "ffmpeg-self-test-result", text: result });
  } catch (err) {
    self.postMessage({
      type: "ffmpeg-self-test-result",
      error: messageOf(err),
    });
  }
}

async function handlePyEcho(text: string): Promise<void> {
  try {
    if (!runtime) throw new Error("py-echo received before init");
    const { pyodide } = await runtime;
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
