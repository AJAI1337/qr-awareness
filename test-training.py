import importlib.util, unittest, threading, hashlib, secrets, json
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from pathlib import Path
spec=importlib.util.spec_from_file_location('training',Path(__file__).with_name('training-server.py'))
app=importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)
class TrainingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password=secrets.token_urlsafe(25)
        app.password_hash=hashlib.scrypt(cls.password.encode(),salt=app.salt,n=16384,r=8,p=1)
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),app.Handler)
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        threading.Thread(target=cls.server.serve_forever,daemon=True).start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
    def request(self,path,data=None,cookie=None,origin=None):
        headers={'Origin':origin or self.base}
        if cookie: headers['Cookie']=cookie
        if data is not None: headers['Content-Type']='application/json'
        req=Request(self.base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try: return urlopen(req)
        except HTTPError as e: return e
    def test_admin_requires_password_and_cookie(self):
        self.assertEqual(self.request('/api/stats').code,401)
        self.assertEqual(self.request('/api/login',{'password':'incorrect'}).code,401)
        r=self.request('/api/login',{'password':self.password})
        self.assertEqual(r.code,200)
        cookie=r.headers['Set-Cookie'].split(';')[0]
        self.assertIn('HttpOnly',r.headers['Set-Cookie'])
        self.assertEqual(self.request('/api/stats',cookie=cookie).code,200)
        self.request('/api/logout',{},cookie=cookie)
        self.assertEqual(self.request('/api/stats',cookie=cookie).code,401)
    def test_write_rejects_cross_origin_and_sensitive_fields(self):
        self.assertEqual(self.request('/api/event',{'template':'clipclub','event':'opened'},origin='https://unrelated.invalid').code,403)
        self.assertEqual(self.request('/api/event',{'template':'clipclub','event':'opened','password':'dummy'}).code,400)
        self.assertEqual(self.request('/api/event',{'template':[],'event':'opened'}).code,400)
    def test_counts_only_and_private_files_unreachable(self):
        app.counts={'counts':{},'updated':None}
        self.assertEqual(self.request('/api/event',{'template':'screenroom','event':'completed'}).code,200)
        self.assertEqual(app.counts['counts'],{'screenroom':{'opened':0,'completed':1}})
        for path in ['/training-server.py','/../backend/worker.mjs','/.git/config']:
            self.assertEqual(self.request(path).code,404)
        self.assertEqual(self.request('/index.html').code,200)
if __name__=='__main__': unittest.main()
