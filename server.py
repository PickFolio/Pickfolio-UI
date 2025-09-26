# A simple Python web server to run the frontend locally.
# This is needed to properly serve the files and enable service worker functionality.
#
# To run:
# 1. Make sure you have Python installed.
# 2. Open your terminal in this 'frontend' directory.
# 3. Run the command: python server.py
# 4. Open your browser to http://localhost:3000

import http.server
import socketserver

PORT = 3000

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving frontend at port", PORT)
    httpd.serve_forever()
