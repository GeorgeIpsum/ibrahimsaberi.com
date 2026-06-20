"""Route subprocess ffmpeg/ffprobe calls into ffmpeg.wasm via the bridge."""

import os
import subprocess

import ffprobe_compat
import fs

_FFMPEG = ("ffmpeg", "avconv")
_FFPROBE = ("ffprobe", "avprobe")


def _kind(args) -> str | None:
    if not args:
        return None
    prog = os.path.basename(str(args[0])).lower()
    if any(prog == n or prog.startswith(n) for n in _FFPROBE):
        return "ffprobe"
    if any(prog == n or prog.startswith(n) for n in _FFMPEG):
        return "ffmpeg"
    return None


def _run_ffmpeg(args) -> tuple[int, bytes, bytes]:
    rest = [str(a) for a in args[1:]]
    if "-version" in rest:
        return 0, b"ffmpeg version wasm-yt-dlp\nbuilt with ffmpeg.wasm\n", b""

    inputs: list[tuple[str, str]] = []
    out_argv: list[str] = []
    i = 0
    while i < len(rest):
        a = rest[i]
        if a == "-i" and i + 1 < len(rest):
            src = fs.strip_file_prefix(rest[i + 1])
            base = os.path.basename(src)
            inputs.append((src, base))
            out_argv.extend(["-i", base])
            i += 2
            continue
        out_argv.append(a)
        i += 1

    out_src = ""
    out_base = ""
    if out_argv and not out_argv[-1].startswith("-"):
        out_src = fs.strip_file_prefix(out_argv[-1])
        out_base = os.path.basename(out_src)
        out_argv[-1] = out_base

    in_bases: list[str] = []
    for src, base in inputs:
        with open(src, "rb") as f:
            fs.put_file(base, f.read())
        in_bases.append(base)

    rmeta, _ = fs.call(
        fs.OP_FFMPEG_EXEC,
        {"argv": out_argv, "inputs": in_bases, "outputs": [out_base] if out_base else []},
    )
    code = int(rmeta.get("code", 1))
    stderr = rmeta.get("stderr", "").encode()

    if out_base:
        try:
            data = fs.get_file(out_base)
            with open(out_src, "wb") as f:
                f.write(data)
            fs.delete_file(out_base)
        except Exception:
            pass
    for base in in_bases:
        try:
            fs.delete_file(base)
        except Exception:
            pass
    return code, b"", stderr


class _FakePopen:
    def __init__(self, args, **kwargs):
        self.args = args
        kind = _kind(args)
        if kind == "ffmpeg":
            self.returncode, self._out, self._err = _run_ffmpeg(args)
        elif kind == "ffprobe":
            self.returncode, self._out, self._err = ffprobe_compat.run(
                [str(a) for a in args]
            )
        else:
            raise OSError(f"subprocess not supported in pyodide: {args}")
        self.stdin = None
        self.stdout = None
        self.stderr = None
        self.pid = -1

    def communicate(self, input=None, timeout=None):
        return self._out, self._err

    def wait(self, timeout=None):
        return self.returncode

    def poll(self):
        return self.returncode

    def kill(self):
        pass

    def terminate(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _run(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if kwargs.get("check") and p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return subprocess.CompletedProcess(args, p.returncode, out, err)


def _check_output(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return out


def install() -> None:
    subprocess.Popen = _FakePopen
    subprocess.run = _run
    subprocess.check_output = _check_output
