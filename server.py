import http.server
import json
import io
import sys
import os
import mimetypes
import tempfile
import time
import traceback

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, 'extension')

# Preload Whistle Model in RAM for Ultra-Low Latency (<10ms)
whistle_model = None
try:
    import needle
    print("[INIT] Loading Cactus Whistle speech model into RAM...")
    whistle_model = needle.Whistle()
    print("[SUCCESS] Cactus Whistle 16.9MB model preloaded. Ready for ultra-low latency transcription.")
except Exception as e:
    print(f"[ERROR] Failed to load needle: {e}")
    whistle_model = None

class CactusSpeechServer(http.server.BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "status": "online",
                "engine": "Cactus Whistle Preloaded",
                "model": "Cactus-Compute/whistle (16.9 MB)",
                "ready": (whistle_model is not None)
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # Serve CRT Phosphor Website Files
        clean_path = self.path.split('?')[0].lstrip('/')
        if clean_path == '' or clean_path == 'index.html':
            clean_path = 'app.html'

        file_path = os.path.join(WEB_DIR, clean_path)

        if os.path.isfile(file_path):
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/octet-stream'

            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', mime_type)
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Error reading file: {e}".encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")

    def do_POST(self):
        if self.path.startswith('/transcribe'):
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(b'{"error": "No audio data received"}')
                return

            audio_data = self.rfile.read(content_length)

            if whistle_model is None:
                self.send_response(500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Needle model not loaded"}).encode('utf-8'))
                return

            tmp_path = None
            try:
                t0 = time.perf_counter()
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    tmp.write(audio_data)
                    tmp_path = tmp.name

                res = whistle_model.transcribe(tmp_path)
                t_total = (time.perf_counter() - t0) * 1000.0
                res['server_ms'] = round(t_total, 1)

                print(f"[TRANSCRIBE] Text: '{res.get('text', '')}' (Lang: {res.get('language')}, Latency: {res['server_ms']}ms)")

                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                print(f"[TRANSCRIBE ERROR] {e}")
                traceback.print_exc()
                self.send_response(500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

def run_server(port=8765):
    server_address = ('0.0.0.0', port)
    httpd = http.server.HTTPServer(server_address, CactusSpeechServer)
    print(f"==================================================")
    print(f"  TOGIC CRT PHOSPHOR SERVER ONLINE:")
    print(f"  --> http://localhost:{port}")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == '__main__':
    port = 8765
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
