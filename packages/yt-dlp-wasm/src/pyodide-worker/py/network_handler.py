"""A yt-dlp RequestHandler that routes requests through libcurl.js/Wisp via the bridge."""

import io

import net
from yt_dlp.networking import Response
from yt_dlp.networking.common import RequestHandler, register_rh
from yt_dlp.networking.exceptions import TransportError


@register_rh
class WispRH(RequestHandler):
    RH_NAME = "wisp"
    _SUPPORTED_URL_SCHEMES = ("http", "https")
    _SUPPORTED_PROXY_SCHEMES = None
    _SUPPORTED_FEATURES = ()

    def _send(self, request):
        data = request.data
        if data is not None and not isinstance(data, (bytes, bytearray)):
            data = data.read()
        headers = dict(request.headers)
        cookie = self._cookie_header(request.url)
        if cookie:
            headers["Cookie"] = cookie
        try:
            status, resp_headers, final_url, body = net.net_send(
                request.method, request.url, headers, data or b"",
            )
        except Exception as e:
            raise TransportError(cause=e) from e
        header_map = {}
        for name, value in resp_headers:
            header_map[name] = value
        return Response(
            fp=io.BytesIO(body), url=final_url, headers=header_map, status=status,
        )

    def _cookie_header(self, url):
        try:
            import urllib.request
            req = urllib.request.Request(url)
            self.cookiejar.add_cookie_header(req)
            return req.get_header("Cookie")
        except Exception:
            return None


def force_global():
    """Prune yt-dlp's global request-handler registry to ONLY WispRH so internally
    built YoutubeDL instances (e.g. yt_dlp.main) use Wisp, not CORS-blocked urllib."""
    from yt_dlp.networking.common import _REQUEST_HANDLERS

    for key in list(_REQUEST_HANDLERS):
        if _REQUEST_HANDLERS[key] is not WispRH:
            del _REQUEST_HANDLERS[key]


def use_only_wisp(ydl):
    """Force a YoutubeDL instance to route all requests through WispRH.

    urllib/requests would fail under the browser's CORS, so they must not be
    selected. Replace the request director's handlers with only WispRH.
    """
    ydl._request_director = ydl.build_request_director([WispRH])
