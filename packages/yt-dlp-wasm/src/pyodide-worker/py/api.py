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
