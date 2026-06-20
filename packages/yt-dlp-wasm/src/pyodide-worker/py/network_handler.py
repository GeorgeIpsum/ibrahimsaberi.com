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
        try:
            status, headers, final_url, body = net.net_send(
                request.method,
                request.url,
                request.headers,
                data or b"",
            )
        except Exception as e:
            raise TransportError(cause=e) from e
        header_map = {}
        for name, value in headers:
            header_map[name] = value
        return Response(
            fp=io.BytesIO(body),
            url=final_url,
            headers=header_map,
            status=status,
        )


def use_only_wisp(ydl):
    """Force a YoutubeDL instance to route all requests through WispRH.

    urllib/requests would fail under the browser's CORS, so they must not be
    selected. Replace the request director's handlers with only WispRH.
    """
    ydl._request_director = ydl.build_request_director([WispRH])
