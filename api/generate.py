from http.server import BaseHTTPRequestHandler
import json
import requests
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        prompt = data.get('prompt', 'A golden cat')
        size = data.get('size', '1024*1024')
        
        api_key = os.environ.get("VIVEK_AI_BOL_IMG")
        if not api_key:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "API Key missing (VIVEK_AI_BOL_IMG)"}).encode())
            return

        base_url = 'https://api-inference.modelscope.ai/'
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-ModelScope-Async-Mode": "true"
        }
        
        width, height = 1024, 1024
        if '*' in size:
            try:
                width, height = map(int, size.split('*'))
            except:
                pass
        
        payload = {
            "model": "Tongyi-MAI/Z-Image-Turbo",
            "prompt": prompt
        }
        if size != "1024*1024":
            payload["parameters"] = {"size": f"{width}x{height}"}

        try:
            response = requests.post(f"{base_url}v1/images/generations", headers=headers, json=payload)
            response.raise_for_status()
            res_data = response.json()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({"task_id": res_data.get("task_id") or res_data.get("id")}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
