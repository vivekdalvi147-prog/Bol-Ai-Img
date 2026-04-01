from http.server import BaseHTTPRequestHandler
import json
import requests
import os
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)
        
        # Try to get taskId from query params or path
        task_id = query_params.get('taskId', [None])[0]
        if not task_id:
            # Fallback to path parsing if not in query
            task_id = parsed_path.path.split('/')[-1]
            if task_id == 'tasks.py' or not task_id:
                task_id = None
        
        if not task_id:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "taskId is required"}).encode())
            return

        api_key = os.environ.get("VIVEK_AI_BOL_IMG")
        if not api_key:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "API Key missing"}).encode())
            return

        base_url = 'https://api-inference.modelscope.ai/'
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-ModelScope-Task-Type": "image_generation"
        }
        
        try:
            response = requests.get(f"{base_url}v1/tasks/{task_id}", headers=headers)
            response.raise_for_status()
            res_data = response.json()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(res_data).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
