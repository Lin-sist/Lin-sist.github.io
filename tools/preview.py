"""Loopback-only static preview with HTTP byte ranges for video seeking."""
import argparse
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public'

class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        if self.headers.get('Range') and path.is_file():
            size = path.stat().st_size
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers['Range'])
            if match:
                first, last = match.groups()
                if not first and last:
                    start, end = max(0, size-int(last)), size-1
                else:
                    start, end = int(first or 0), min(int(last) if last else size-1, size-1)
                if start > end or start >= size:
                    self.send_response(416)
                    self.send_header('Content-Range', f'bytes */{size}')
                    self.send_header('Content-Length','0')
                    self.end_headers()
                    return None
                self.send_response(206)
                self.send_header('Content-Type', self.guess_type(str(path)))
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
                self.send_header('Content-Length',str(end-start+1))
                self.send_header('Accept-Ranges','bytes')
                self.end_headers()
                file=path.open('rb')
                file.seek(start)
                self.byte_range=(start,end)
                return file
        return super().send_head()

    def copyfile(self, source, outputfile):
        try:
            if self.byte_range:
                remaining=self.byte_range[1]-self.byte_range[0]+1
                while remaining:
                    block=source.read(min(65536,remaining))
                    if not block:break
                    outputfile.write(block)
                    remaining-=len(block)
            else:
                super().copyfile(source,outputfile)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=5187)
    args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(ROOT)))
    print(f'Lin homepage: http://127.0.0.1:{args.port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
