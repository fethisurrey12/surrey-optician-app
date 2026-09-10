#!/usr/bin/env python3
"""Generate the app icon, splash and favicon from the wordmark.

The project shipped with Emergent's own logo in these slots, which would have
reached the App Store as Surrey Opticians' identity. These are typographic
stand-ins in the practice's colours, drawn with Fraunces — the same face the
in-app wordmark uses — so the app is consistent until the practice supplies
its real logo artwork.

    python3 scripts/make-brand-assets.py

Replace assets/images/{icon,adaptive-icon,splash-image,favicon}.png with the
real logo when it arrives; nothing else needs to change.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
OUT = ROOT / "assets" / "images"

TEAL = (11, 110, 117, 255)
PAPER = (255, 255, 255, 255)
INK = (14, 22, 24, 255)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def centre(draw, xy, text, fnt, fill, tracking=0):
    """Draw text centred on xy, with optional letter spacing."""
    if not tracking:
        draw.text(xy, text, font=fnt, fill=fill, anchor="mm")
        return
    widths = [draw.textlength(c, font=fnt) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = xy[0] - total / 2
    for c, w in zip(text, widths):
        draw.text((x, xy[1]), c, font=fnt, fill=fill, anchor="lm")
        x += w + tracking


def monogram(size: int, bg, fg) -> Image.Image:
    """"SO" on a rounded field — legible down to a home-screen icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg is not None:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=bg)
    f = font("Fraunces-SemiBold.ttf", int(size * 0.44))
    centre(d, (size / 2, size / 2 + size * 0.02), "SO", f, fg, tracking=int(size * 0.02))
    return img


def wordmark(width: int, height: int, on_teal: bool) -> Image.Image:
    """The stacked wordmark, as used for the splash."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    top = INK if not on_teal else PAPER
    accent = TEAL if not on_teal else PAPER
    serif = font("Fraunces-Light.ttf", int(width * 0.155))
    small = font("Inter-Medium.ttf", int(width * 0.062))
    centre(d, (width / 2, height / 2 - width * 0.055), "SURREY", serif, top, tracking=int(width * 0.022))
    centre(d, (width / 2, height / 2 + width * 0.075), "OPTICIANS", small, accent, tracking=int(width * 0.052))
    return img


def main() -> None:
    # iOS icon — no transparency allowed, so the teal field is baked in.
    monogram(1024, TEAL, PAPER).convert("RGB").save(OUT / "icon.png")

    # Android adaptive foreground: transparent, mark kept inside the safe zone
    # because the launcher masks and moves it.
    layer = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    layer.paste(monogram(560, None, PAPER), (232, 232), monogram(560, None, PAPER))
    layer.save(OUT / "adaptive-icon.png")

    # Splash: the wordmark on transparent, over the white set in app.json.
    splash = Image.new("RGBA", (900, 900), (0, 0, 0, 0))
    mark = wordmark(760, 300, on_teal=False)
    splash.paste(mark, (70, 300), mark)
    splash.save(OUT / "splash-image.png")

    monogram(196, TEAL, PAPER).convert("RGB").save(OUT / "favicon.png")

    for n in ("icon.png", "adaptive-icon.png", "splash-image.png", "favicon.png"):
        p = OUT / n
        print(f"  {n:20} {Image.open(p).size}  {p.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
