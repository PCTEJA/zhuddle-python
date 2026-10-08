"""Rebuild small page media. Requires Pillow and imageio-ffmpeg (development only)."""
from pathlib import Path
import subprocess
from PIL import Image, ImageSequence
import imageio_ffmpeg

assets = Path(__file__).resolve().parents[1] / 'public' / 'assets'
art = assets / 'zhuddle'
with Image.open(art / 'emerald-aurora-learner-banner.png') as source:
    source.save(art / 'welcome-poster-hd-v2.webp', quality=90, method=6)

with Image.open(assets / 'customer-care.gif') as source:
    frames, durations = [], []
    for frame in ImageSequence.Iterator(source):
        frames.append(frame.convert('RGBA').resize((68, 68), Image.Resampling.LANCZOS))
        durations.append(frame.info.get('duration', 100))
    frames[0].save(assets / 'customer-care-v1.webp', save_all=True,
                   append_images=frames[1:], duration=durations, loop=source.info.get('loop', 0), quality=78, method=6)
    frames[0].save(assets / 'customer-care-still-v1.webp', quality=80, method=6)

# Preserve the welcome banner's native 3840 x 996 resolution. Its wide crop
# becomes visibly soft on large/high-DPI screens when reduced to 960 x 250.
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(art / 'welcome-banner.mp4'),
                '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                '-an', '-movflags', '+faststart', str(art / 'welcome-banner-hd-v3.mp4')],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

for name, width in [('snake-adventure', 480)]:
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(art / f'{name}.mp4'),
                    '-vf', f'scale={width}:-2,fps=24', '-c:v', 'libx264', '-crf', '30',
                    '-preset', 'slow', '-an', '-movflags', '+faststart',
                    str(art / f'{name}-v2.mp4')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

for path in [art / 'welcome-poster-hd-v2.webp', assets / 'customer-care-v1.webp',
             art / 'welcome-banner-hd-v3.mp4', art / 'snake-adventure-v2.mp4']:
    print(f'{path.name}: {path.stat().st_size:,} bytes')
