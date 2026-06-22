"""Raw HTTP over the JS bridge (libcurl.js/Wisp). Returns (status, headers, url, body)."""

import fs

OP_NET_SEND = 7


def net_send(method: str, url: str, headers, body: bytes = b""):
    body_key = None
    if body:
        body_key = "__reqbody"
        fs.put_file(body_key, body)
    hdr_pairs = list(headers.items()) if hasattr(headers, "items") else list(headers)
    rmeta, _ = fs.call(
        OP_NET_SEND,
        {"method": method, "url": url, "headers": hdr_pairs, "bodyKey": body_key},
    )
    if body_key:
        fs.delete_file(body_key)
    data = fs.get_file(rmeta["bodyKey"])
    fs.delete_file(rmeta["bodyKey"])
    return rmeta["status"], rmeta["headers"], rmeta["url"], data
