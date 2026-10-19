"""Local training preview with password-protected anonymous counters. No dependency install."""
import argparse, getpass, hashlib, hmac, json, os, secrets, threading, time
from pathlib import Path
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from http.cookies import SimpleCookie
ROOT = Path(__file__).resolve().parent / 'docs' / 'simulation'
lock = threading.Lock()
sessions, attempts = {}, []
counts = {'counts': {}, 'updated': None}
salt = secrets.token_bytes(32)
password_hash = b''
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'")
        super().end_headers()
    def reply(self, status, data, cookie=None):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)
    def authenticated(self):
        try:
            c = SimpleCookie(self.headers.get('Cookie', ''))
            token = c.get('training_session')
            return bool(token and sessions.get(token.value, 0) > time.time())
        except Exception:
            return False
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/api/stats':
            if not self.authenticated():
                return self.reply(401, {'error': 'Authentication required'})
            with lock:
                return self.reply(200, counts)
        allowed = {'/', '/index.html', '/admin.html', '/admin.js', '/app.js', '/builder.html', '/qr.html', '/qrcode.min.js', '/training.css', '/scene.js', '/slides.js', '/presentation.html', '/clipclub.html', '/screenroom.html', '/clouddesk.html'}
        if path not in allowed:
            return self.reply(404, {'error': 'Not found'})
        return super().do_GET()
    def do_HEAD(self):
        return self.reply(405, {'error': 'Method not allowed'})
    def do_POST(self):
        if self.headers.get('Origin') != 'http://' + self.headers.get('Host', ''):
            return self.reply(403, {'error': 'Same-origin request required'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length > 2048 or length < 0:
                return self.reply(413, {'error': 'Request too large'})
            data = json.loads(self.rfile.read(length) or b'{}')
            if not isinstance(data, dict):
                raise ValueError()
        except ValueError:
            return self.reply(400, {'error': 'Invalid request'})
        path = urlsplit(self.path).path
        if path == '/api/login':
            global attempts
            with lock:
                now = time.time()
                attempts = [t for t in attempts if now-t < 60]
                if len(attempts) >= 10:
                    return self.reply(429, {'error': 'Try again later'})
                attempts.append(now)
            value = data.get('password', '')
            if not isinstance(value, str):
                return self.reply(400, {'error': 'Invalid request'})
            candidate = hashlib.scrypt(value.encode(), salt=salt, n=16384, r=8, p=1)
            if not hmac.compare_digest(candidate, password_hash):
                return self.reply(401, {'error': 'Invalid credentials'})
            token = secrets.token_urlsafe(32)
            with lock:
                for old, expiry in list(sessions.items()):
                    if expiry < time.time():
                        sessions.pop(old, None)
                sessions[token] = time.time()+3600
            return self.reply(200, {'ok': True}, 'training_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600')
        if path == '/api/logout':
            try:
                c = SimpleCookie(self.headers.get('Cookie', ''))
                if 'training_session' in c:
                    sessions.pop(c['training_session'].value, None)
            except Exception:
                pass
            return self.reply(200, {'ok': True}, 'training_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
        if path == '/api/event':
            template, event = data.get('template'), data.get('event')
            if not isinstance(template, str) or not isinstance(event, str) or template not in {'clipclub','screenroom','clouddesk'} or event not in {'opened','completed'} or set(data) != {'template','event'}:
                return self.reply(400, {'error': 'Unknown event'})
            with lock:
                bucket = counts['counts'].setdefault(template, {'opened': 0, 'completed': 0})
                bucket[event] += 1
                counts['updated'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
            return self.reply(200, {'ok': True})
        return self.reply(404, {'error': 'Not found'})
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    password = os.environ.get('TRAINING_ADMIN_PASSWORD') or getpass.getpass('Set admin password (12+ characters): ')
    if len(password) < 12:
        raise SystemExit('Use at least 12 characters for the admin password.')
    password_hash = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    del password
    print(f'Training studio: http://127.0.0.1:{args.port}', flush=True)
    print('Admin: /admin.html. Counters reset on restart. No visitor request logging.', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
