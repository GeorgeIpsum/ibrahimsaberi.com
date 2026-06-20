"""Bridge between yt-dlp's synchronous Python world and the JS sync bridge.

`ytdlp_bridge_js` is a JS module registered by the worker; its `call(op, u8)`
performs a synchronous SharedArrayBuffer round-trip (the JS side blocks on
Atomics.wait). Marshalling: Python bytes -> JS Uint8Array via to_js; the JS
result (a Uint8Array) -> Python bytes via .to_py().
"""

from pyodide.ffi import to_js
import ytdlp_bridge_js

OP_ECHO = 1


def call(op: int, data: bytes) -> bytes:
    result = ytdlp_bridge_js.call(op, to_js(data))
    try:
        return bytes(result.to_py())
    finally:
        result.destroy()


def echo(text: str) -> str:
    return call(OP_ECHO, text.encode()).decode()
