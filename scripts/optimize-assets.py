"""Create web-sized copies of the supplied self-contained motion SVGs.

Usage: python scripts/optimize-assets.py ../assets/zhuddle/generated
Requires Pillow. Source artwork, frame coordinates, and animation CSS are preserved.
Only embedded PNG encoding/resolution changes; originals remain outside public/.
"""
import base64
import io
import json
import re
import sys
from pathlib import Path
from PIL import Image

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'public/assets/zhuddle'
target.mkdir(parents=True, exist_ok=True)
cache = {}

def compress(match):
    encoded = match.group(1)
    if encoded not in cache:
        im = Image.open(io.BytesIO(base64.b64decode(encoded))).convert('RGBA')
        im.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        im.save(out, format='WEBP', quality=84, method=6)
        cache[encoded] = 'data:image/webp;base64,' + base64.b64encode(out.getvalue()).decode()
    return cache[encoded]

before = after = 0
for file in sorted(source.glob('*.svg')):
    text = file.read_text(encoding='utf-8')
    optimized = re.sub(r'data:image/png;base64,([A-Za-z0-9+/=]+)', compress, text)
    (target / file.name).write_text(optimized, encoding='utf-8')
    before += file.stat().st_size
    after += len(optimized.encode())
(target / 'catalog.json').write_text((source / 'catalog.json').read_text(encoding='utf-8'), encoding='utf-8')
print(json.dumps({'original_svg_bytes': before, 'production_svg_bytes': after, 'reduction_percent': round((1-after/before)*100, 1)}))
