import { createSab } from "../bridge/sab";

export interface YtDlpConfig {
  /** SAB data-region capacity in bytes. Phase 1 default 16 MiB. */
  dataCapacity?: number;
}

export interface YtDlp {
  /** ECHO round-trip through the sync bridge; returns the uppercased text. */
  ping(text: string): Promise<string>;
  terminate(): void;
}

// A computed path segment keeps the bundler from statically resolving (and
// rewriting/asset-hashing) the URL at build time; it resolves at runtime
// relative to this module's final location (dist/index.js), i.e. to
// dist/<name>/worker.js.
function spawnWorker(name: "pyodide-worker" | "services-worker"): Worker {
  const url = new URL(`./${name}/worker.js`, import.meta.url);
  return new Worker(url, { type: "module" });
}

export function createYtDlp(config: YtDlpConfig = {}): YtDlp {
  const sab = createSab(config.dataCapacity ?? 16 * 1024 * 1024);

  const pyodideWorker = spawnWorker("pyodide-worker");
  const servicesWorker = spawnWorker("services-worker");

  const channel = new MessageChannel();
  pyodideWorker.postMessage({ type: "init", sab, wakePort: channel.port1 }, [
    channel.port1,
  ]);
  servicesWorker.postMessage({ type: "init", sab, wakePort: channel.port2 }, [
    channel.port2,
  ]);

  return {
    ping(text: string): Promise<string> {
      return new Promise((resolve) => {
        const onMsg = (e: MessageEvent) => {
          if (e.data?.type === "pong") {
            pyodideWorker.removeEventListener("message", onMsg);
            resolve(e.data.text as string);
          }
        };
        pyodideWorker.addEventListener("message", onMsg);
        pyodideWorker.postMessage({ type: "ping", text });
      });
    },
    terminate(): void {
      pyodideWorker.terminate();
      servicesWorker.terminate();
    },
  };
}
