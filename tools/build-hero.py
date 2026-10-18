#!/usr/bin/env python3
"""Build the opening (hero) video from Houston forest photos on Wikimedia Commons.

Usage (from the repo root; needs Python 3 with Pillow, and ffmpeg built with
libsvtav1, libx265 and libx264):

    python3 tools/build-hero.py [work_dir]

Outputs assets/video/hero-{av1,hevc,sm,sm-av1,sm-hevc}.mp4 and hero.jpg.

How it works:
- Each photo gets a slow, eased 1.00 -> 1.06 push-in for 8 s and a 2 s eased
  crossfade into the next. Frames are rendered here with a sub-pixel crop
  (ffmpeg's zoompan snaps to whole pixels and stutters).
- Photos are pre-sized once with Lanczos to output size x max zoom, so the
  per-frame resample stays between 1.00x and 1.06x (sharp, no shimmer).
- The loop starts on a clean frame of the first photo; the last photo's
  crossfade into the first plays at the very end, so the loop is seamless and
  the poster (frame 0) matches the first frame shown.
"""
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request

from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "video")
WORK = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, ".hero-build")

# In playback order. All CC BY-SA (credited in the footer and README).
PHOTOS = [
    "File:Houston May 2022 13 (Buffalo Bayou Park and skyline).jpg",  # Michael Barera, CC BY-SA 4.0
    "File:Mercer Arboretum, 2012, Houston, Texas.JPG",                 # Another Believer, CC BY-SA 3.0
    "File:Houston May 2022 11 (Buffalo Bayou Park).jpg",               # Michael Barera, CC BY-SA 4.0
    "File:Mercer Arboretum, 2012, Houston.JPG",                        # Another Believer, CC BY-SA 3.0
    "File:Houston May 2022 12 (Buffalo Bayou Park).jpg",               # Michael Barera, CC BY-SA 4.0
]
W, H, FPS = 1920, 1080, 30
D, XF, Z = 8, 2, 0.06            # seconds per photo, crossfade seconds, max zoom
UA = {"User-Agent": "TREE-site-build/1.0 (houstontreeinitiative@gmail.com)"}


def download(title, dest):
    if os.path.exists(dest):
        return
    q = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "imageinfo",
                                "iiprop": "url", "format": "json"})
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers=UA)
    page = next(iter(json.load(urllib.request.urlopen(req))["query"]["pages"].values()))
    url = page["imageinfo"][0]["url"]
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(dest, "wb") as f:
        f.write(r.read())


def prepare(path):
    im = Image.open(path).convert("RGB")
    sw, sh = im.size
    tw, th = (sw, round(sw * 9 / 16)) if sw / sh < 16 / 9 else (round(sh * 16 / 9), sh)
    im = im.crop(((sw - tw) // 2, (sh - th) // 2, (sw - tw) // 2 + tw, (sh - th) // 2 + th))
    im = im.resize((round(W * (1 + Z)), round(H * (1 + Z))), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=3))
    im = ImageEnhance.Brightness(im).enhance(1.03)
    return ImageEnhance.Color(im).enhance(1.08)


def ease(t):
    return t * t * (3 - 2 * t)


def render_master(srcs, master):
    seg, step, xf = D * FPS, (D - XF) * FPS, XF * FPS
    n = len(srcs)

    def frame(i, k):
        z = 1 + Z * ease(k / (seg - 1))
        sw, sh = srcs[i].size
        cw, ch = W * (1 + Z) / z, H * (1 + Z) / z
        x0, y0 = (sw - cw) / 2, (sh - ch) / 2
        return srcs[i].transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC)

    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "ffv1", "-level", "3", master],
                         stdin=subprocess.PIPE)
    total = n * step
    for f in range(total):
        g = (f + xf) % total            # start just after the first crossfade (clean frame)
        i, k = divmod(g, step)
        img = frame(i, k)
        if k < xf:                      # fading in from the previous photo
            a = ease(k / xf)
            img = Image.blend(frame((i - 1) % n, k + step), img, a)
        p.stdin.write(img.tobytes())
    p.stdin.close()
    if p.wait():
        sys.exit("ffmpeg failed while rendering the master")


def encode(master, name, args, scale=None):
    vf = ["-vf", f"scale={scale}:flags=lanczos"] if scale else []
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", master, *vf, *args, "-pix_fmt", "yuv420p",
                    "-an", "-movflags", "+faststart", os.path.join(OUT, name)], check=True)


def main():
    os.makedirs(WORK, exist_ok=True)
    paths = []
    for n, title in enumerate(PHOTOS):
        dest = os.path.join(WORK, f"photo{n}.jpg")
        download(title, dest)
        paths.append(dest)
    print("rendering master…")
    master = os.path.join(WORK, "master.mkv")
    render_master([prepare(p) for p in paths], master)

    av1 = ["-c:v", "libsvtav1", "-preset", "5", "-g", "150", "-svtav1-params", "tune=0"]
    hevc = ["-c:v", "libx265", "-preset", "medium", "-tag:v", "hvc1", "-x265-params", "keyint=150:log-level=error"]
    h264 = ["-c:v", "libx264", "-preset", "slow", "-x264-params", "keyint=150"]
    print("encoding…")
    encode(master, "hero-av1.mp4", av1 + ["-crf", "36"])
    encode(master, "hero-hevc.mp4", hevc + ["-crf", "29"])
    encode(master, "hero-sm-av1.mp4", av1 + ["-crf", "38"], "960:540")
    encode(master, "hero-sm-hevc.mp4", hevc + ["-crf", "30"], "960:540")
    encode(master, "hero-sm.mp4", h264 + ["-crf", "30"], "960:540")
    # Poster = frame 0, so there is no jump when playback starts
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", master, "-frames:v", "1",
                    "-vf", "scale=1600:-2", "-q:v", "5", os.path.join(OUT, "hero.jpg")], check=True)
    print("done; master kept at", master)


if __name__ == "__main__":
    main()
