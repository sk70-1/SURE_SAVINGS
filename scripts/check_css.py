import urllib.request
import re

html = urllib.request.urlopen('http://localhost:3001').read().decode()

# Check CSS
css_matches = re.findall(r'href="([^"]+\.css[^"]*)"', html)
for css in css_matches:
    res = urllib.request.urlopen('http://localhost:3001' + css)
    print(f"CSS: {css} -> Status: {res.status}, Size: {len(res.read())} bytes")

# Check JS scripts
script_matches = re.findall(r'src="([^"]+\.js[^"]*)"', html)
all_ok = True
for s in script_matches:
    res = urllib.request.urlopen('http://localhost:3001' + s)
    if res.status != 200:
        print(f"JS FAILED: {s} -> {res.status}")
        all_ok = False

if all_ok:
    print(f"All {len(script_matches)} JavaScript chunks returned 200 OK!")
