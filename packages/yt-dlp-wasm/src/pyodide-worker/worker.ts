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
    requester = new SabRequester(msg.sab as SharedArrayBuffer, (reqId) =>
      self.postMessage({ type: "wake", reqId }),
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
  } else if (msg?.type === "net-fetch") {
    void handleNetFetch(msg.url as string);
  } else if (msg?.type === "extract-info") {
    void handleExtractInfo(msg.url as string);
  }
};

async function handleNetFetch(url: string): Promise<void> {
  try {
    if (!runtime) throw new Error("net-fetch before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_net_url", url);
    const result = pyodide.runPython(`
import json, net
_status, _headers, _final, _body = net.net_send("GET", _net_url, {})
json.dumps({"status": _status, "size": len(_body), "preview": _body[:200].decode("utf-8", "replace")})
`) as string;
    self.postMessage({ type: "net-fetch-result", text: result });
  } catch (err) {
    self.postMessage({ type: "net-fetch-result", error: messageOf(err) });
  }
}

async function handleExtractInfo(url: string): Promise<void> {
  try {
    if (!runtime) throw new Error("extract-info before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_xi_url", url);
    const result = (await pyodide.runPythonAsync(`
import json, yt_dlp, network_handler
_ydl = yt_dlp.YoutubeDL({"quiet": True, "skip_download": True, "noplaylist": True})
network_handler.use_only_wisp(_ydl)
_info = _ydl.extract_info(_xi_url, download=False)
_clean = _ydl.sanitize_info(_info)
json.dumps({"title": _clean.get("title"), "ext": _clean.get("ext"), "id": _clean.get("id"), "extractor": _clean.get("extractor")})
`)) as string;
    self.postMessage({ type: "extract-info-result", text: result });
  } catch (err) {
    self.postMessage({ type: "extract-info-result", error: messageOf(err) });
  }
}

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
