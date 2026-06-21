"""Public API entrypoints run inside Pyodide."""

import io
import json
import os
import sys

_WORK = "/work"


def _ensure_work():
    os.makedirs(_WORK, exist_ok=True)


def _list_outputs():
    return [
        {"name": f, "size": os.path.getsize(os.path.join(_WORK, f))}
        for f in sorted(os.listdir(_WORK))
        if os.path.isfile(os.path.join(_WORK, f))
    ]


def _apply_cookies(opts: dict) -> dict:
    """If opts carries a raw cookies.txt string, write it and switch to cookiefile."""
    txt = opts.pop("cookiesTxt", None)
    if txt:
        path = "/tmp/cookies.txt"
        with open(path, "w") as f:
            f.write(txt)
        opts["cookiefile"] = path
    return opts


def run_extract_info(url: str, opts_json: str) -> str:
    import yt_dlp
    import network_handler

    user_opts = _apply_cookies(json.loads(opts_json) if opts_json else {})
    opts = {"quiet": True, "skip_download": True, "noplaylist": True, **user_opts}
    with yt_dlp.YoutubeDL(opts) as ydl:
        network_handler.use_only_wisp(ydl)
        info = ydl.extract_info(url, download=False)
        clean = ydl.sanitize_info(info)
    return json.dumps({
        "title": clean.get("title"),
        "ext": clean.get("ext"),
        "id": clean.get("id"),
        "extractor": clean.get("extractor"),
        "formatCount": len(clean.get("formats") or []),
    })


def run_exec(argv) -> str:
    _ensure_work()
    import network_handler
    try:
        network_handler.force_global()
    except Exception:
        pass
    import yt_dlp

    out, err = io.StringIO(), io.StringIO()
    real_out, real_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    code = 0
    cwd = os.getcwd()
    os.chdir(_WORK)
    try:
        yt_dlp.main(list(argv))
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else (0 if not e.code else 1)
    except Exception as e:  # noqa: BLE001
        code = 1
        err.write(str(e))
    finally:
        sys.stdout, sys.stderr = real_out, real_err
        os.chdir(cwd)
    return json.dumps(
        {"exitCode": code, "stdout": out.getvalue(), "stderr": err.getvalue(), "files": _list_outputs()},
    )


def run_download(url: str, opts_json: str, emit) -> str:
    _ensure_work()
    import yt_dlp
    import network_handler

    user_opts = _apply_cookies(json.loads(opts_json) if opts_json else {})

    def _emit_safe(channel, payload):
        try:
            emit(channel, payload)
        except Exception:
            pass

    class _Logger:
        def debug(self, m):
            if not str(m).startswith("[debug]"):
                _emit_safe("log", str(m))

        def info(self, m):
            _emit_safe("log", str(m))

        def warning(self, m):
            _emit_safe("log", "WARNING: " + str(m))

        def error(self, m):
            _emit_safe("log", "ERROR: " + str(m))

    def _hook(d):
        keys = (
            "status", "downloaded_bytes", "total_bytes", "total_bytes_estimate",
            "eta", "speed", "filename",
        )
        _emit_safe("progress", json.dumps({k: d.get(k) for k in keys}))

    opts = {
        "paths": {"home": _WORK},
        "outtmpl": "%(title)s.%(ext)s",
        "logger": _Logger(),
        "progress_hooks": [_hook],
        "noplaylist": True,
        **user_opts,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        network_handler.use_only_wisp(ydl)
        ydl.download([url])
    return json.dumps({"files": _list_outputs()})
