from http.server import BaseHTTPRequestHandler
import json
import google.generativeai as genai
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        prompt = data.get('prompt', '')
        if not prompt:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Prompt is required"}).encode())
            return

        api_key = os.environ.get("TXT_MODEL_VIVEK_BOL_AI") or os.environ.get("BOL_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "API Key missing (TXT_MODEL_VIVEK_BOL_AI)"}).encode())
            return

        genai.configure(api_key=api_key)
        
        # User strictly requested Gemini 3.1 Flash Lite Preview (gemini-3.1-flash-lite-preview)
        model_name = "gemini-3.1-flash-lite-preview"
        
        upgrade_instruction = f"""You are BOL-AI, a master image prompt engineer. Transform this basic idea into a legendary, hyper-detailed, and visually breathtaking image generation prompt.
        
        INPUT: "{prompt}"
        
        DIRECTIONS:
        - Expand significantly with artistic details, lighting, and camera settings.
        - Use high-impact terms like 'hyper-realistic', '8k', 'unreal engine 5'.
        - Return ONLY the upgraded prompt text. No chatter.
        - Max 2000 characters."""

        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                upgrade_instruction,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=500
                )
            )
            
            enhanced_text = response.text or prompt
            if len(enhanced_text) > 2000:
                enhanced_text = enhanced_text[:2000]
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({"enhancedPrompt": enhanced_text}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
