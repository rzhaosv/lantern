"""Generate Lantern app icons with Pillow.

  python3 scripts/make_icons.py

Writes assets/icon.png (1024, opaque), adaptive-icon.png (1024, transparent foreground),
splash-icon.png (1024, transparent), notification-icon.png (96, white on transparent) and favicon.png (64).
"""
from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
BG = (14, 11, 31)
BG_EDGE = (8, 6, 20)
BG_CENTER = (37, 30, 69)
GOLD = (245, 194, 107)
GOLD_DEEP = (217, 178, 103)
BRASS = (181, 141, 72)
EMBER = (242, 140, 91)
CREAM = (255, 243, 214)
GLASS = (11, 8, 32)


def radial_bg(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    px = img.load()
    cx, cy = size / 2, size * 0.52
    rmax = size * 0.72
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / rmax
            t = min(1.0, d)
            t = t * t
            r = BG_CENTER[0] + (BG_EDGE[0] - BG_CENTER[0]) * t
            g = BG_CENTER[1] + (BG_EDGE[1] - BG_CENTER[1]) * t
            b = BG_CENTER[2] + (BG_EDGE[2] - BG_CENTER[2]) * t
            px[x, y] = (int(r), int(g), int(b))
    return img


def glow_layer(size: int, cx: float, cy: float, radius: float, color, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def flame(d: ImageDraw.ImageDraw, cx: float, base_y: float, h: float, w: float, color):
    pts = []
    n = 40
    for i in range(n + 1):
        t = i / n  # 0..1 left side up
        y = base_y - h * t
        # teardrop width profile
        ww = w * math.sin(math.pi * (0.5 * t + 0.5)) * (1 - t * 0.15) if t < 1 else 0
        pts.append((cx - ww, y))
    for i in range(n, -1, -1):
        t = i / n
        y = base_y - h * t
        ww = w * math.sin(math.pi * (0.5 * t + 0.5)) * (1 - t * 0.15) if t < 1 else 0
        pts.append((cx + ww, y))
    d.polygon(pts, fill=color)


def draw_lantern(size: int, transparent: bool, scale: float = 1.0, mono: bool = False) -> Image.Image:
    s = size
    u = s / 1024 * scale  # unit
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0)) if transparent else radial_bg(s).convert("RGBA")

    cx = s / 2
    # geometry (in units of 1024 canvas)
    body_w, body_h = 380 * u, 470 * u
    body_top = s / 2 - 180 * u
    body_left = cx - body_w / 2
    flame_base_y = body_top + body_h * 0.78
    flame_h = 200 * u
    flame_w = 74 * u

    if mono:
        d = ImageDraw.Draw(canvas)
        white = (255, 255, 255, 255)
        # handle
        d.arc([cx - 150 * u, body_top - 200 * u, cx + 150 * u, body_top + 60 * u], 200, 340, fill=white, width=int(26 * u))
        # cap
        d.rounded_rectangle([cx - 240 * u, body_top - 40 * u, cx + 240 * u, body_top + 20 * u], radius=24 * u, fill=white)
        # body outline
        d.rounded_rectangle([body_left, body_top, body_left + body_w, body_top + body_h], radius=70 * u, outline=white, width=int(26 * u))
        # base
        d.rounded_rectangle([cx - 260 * u, body_top + body_h - 10 * u, cx + 260 * u, body_top + body_h + 60 * u], radius=30 * u, fill=white)
        flame(d, cx, flame_base_y, flame_h, flame_w, white)
        return canvas

    # glow
    canvas.alpha_composite(glow_layer(s, cx, flame_base_y - flame_h * 0.45, 330 * u, EMBER, 110))
    canvas.alpha_composite(glow_layer(s, cx, flame_base_y - flame_h * 0.45, 200 * u, GOLD, 150))

    d = ImageDraw.Draw(canvas)
    # handle arc
    d.arc([cx - 150 * u, body_top - 200 * u, cx + 150 * u, body_top + 60 * u], 200, 340, fill=GOLD_DEEP, width=int(24 * u))
    # cap
    d.polygon([(cx - 150 * u, body_top - 10 * u), (cx - 100 * u, body_top - 80 * u), (cx + 100 * u, body_top - 80 * u), (cx + 150 * u, body_top - 10 * u)], fill=BRASS)
    d.rounded_rectangle([cx - 230 * u, body_top - 30 * u, cx + 230 * u, body_top + 18 * u], radius=20 * u, fill=GOLD_DEEP)
    # body
    d.rounded_rectangle([body_left, body_top, body_left + body_w, body_top + body_h], radius=70 * u, fill=(37, 30, 69, 255), outline=GOLD_DEEP, width=int(16 * u))
    # window
    win_pad = 44 * u
    win = [body_left + win_pad, body_top + win_pad, body_left + body_w - win_pad, body_top + body_h - win_pad]
    d.rounded_rectangle(win, radius=44 * u, fill=GLASS)
    # inner glow inside window
    inner = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    inner.alpha_composite(glow_layer(s, cx, flame_base_y - flame_h * 0.35, 190 * u, GOLD, 200))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle(win, radius=44 * u, fill=255)
    canvas.paste(inner, (0, 0), Image.composite(inner.split()[3], Image.new("L", (s, s), 0), mask))
    d = ImageDraw.Draw(canvas)
    # flame (three layers)
    flame(d, cx, flame_base_y, flame_h, flame_w, EMBER)
    flame(d, cx, flame_base_y, flame_h * 0.68, flame_w * 0.62, GOLD)
    flame(d, cx, flame_base_y, flame_h * 0.36, flame_w * 0.32, CREAM)
    # wick
    d.rounded_rectangle([cx - 8 * u, flame_base_y - 6 * u, cx + 8 * u, flame_base_y + 26 * u], radius=6 * u, fill=(74, 58, 42))
    # base
    d.rounded_rectangle([cx - 260 * u, body_top + body_h - 6 * u, cx + 260 * u, body_top + body_h + 54 * u], radius=28 * u, fill=GOLD_DEEP)
    d.rounded_rectangle([cx - 200 * u, body_top + body_h + 50 * u, cx + 200 * u, body_top + body_h + 96 * u], radius=24 * u, fill=BRASS)
    return canvas


def main():
    os.makedirs(ROOT, exist_ok=True)
    icon = draw_lantern(1024, transparent=False, scale=1.0).convert("RGB")
    icon.save(os.path.join(ROOT, "icon.png"))
    adaptive = draw_lantern(1024, transparent=True, scale=0.72)
    adaptive.save(os.path.join(ROOT, "adaptive-icon.png"))
    splash = draw_lantern(1024, transparent=True, scale=0.9)
    splash.save(os.path.join(ROOT, "splash-icon.png"))
    notif = draw_lantern(1024, transparent=True, scale=0.95, mono=True).resize((96, 96), Image.LANCZOS)
    notif.save(os.path.join(ROOT, "notification-icon.png"))
    icon.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, "favicon.png"))
    print("icons written to", os.path.abspath(ROOT))


if __name__ == "__main__":
    main()
