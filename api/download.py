from http.server import BaseHTTPRequestHandler
import requests
import os
from urllib.parse import urlparse, parse_qs
import time

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)
        
        url = query_params.get('url', [None])[0]
        if not url:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"URL is required")
            return

        fetch_url = url
        if url.startswith('/'):
            protocol = self.headers.get('x-forwarded-proto', 'http')
            host = self.headers.get('host', 'localhost')
            fetch_url = f"{protocol}://{host}{url}"

        try:
            response = requests.get(fetch_url)
            response.raise_for_status()
            
            content_type = response.headers.get('content-type', 'image/png')
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Disposition', f'attachment; filename="bol-ai-{int(time.time())}.png"')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())
