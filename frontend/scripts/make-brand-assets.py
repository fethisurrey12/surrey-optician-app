#!/usr/bin/env python3
"""Generate the app icon, splash and favicon from the wordmark.

The project shipped with Emergent's own logo in these slots, which would have
reached the App Store as Surrey Opticians' identity. These are typographic
stand-ins in the practice's own colours, matching the lowercase two-tone
wordmark on surreyopticians.co.uk.

They are NOT the practice's logo mark — that artwork (the turquoise tile with
the white spectacles motif) has to come from the practice as a file. Drop it
into assets/images over these and nothing else needs to change.

    python3 scripts/make-brand-assets.py

Replace assets/images/{icon,adaptive-icon,splash-image,favicon}.png with the
real logo when it arrives; nothing else needs to change.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
OUT = ROOT / "assets" / "images"

TURQUOISE = (75, 166, 188, 255)   # the logo tile
INK = (23, 23, 51, 255)           # the navy-black of "surrey"
PAPER = (255, 255, 255, 255)


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
    """"so" on a rounded turquoise tile — legible down to a home-screen icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg is not None:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=bg)
    f = font("Inter-Regular.ttf", int(size * 0.50))
    centre(d, (size / 2, size / 2 - size * 0.01), "so", f, fg, tracking=int(size * -0.01))
    return img


def tile(width: int, height: int) -> Image.Image:
    """The turquoise tile with the white lens motif.

    Traced by eye from the logo on surreyopticians.co.uk. Three linked
    elements, read left to right: an open arc sweeping in from the tile's left
    edge, a smaller ring dropped below it, and the largest ring set high to the
    right. All three share one stroke weight and overlap like links, and the
    right of the tile is left open.

    Still a trace, not the practice's artwork — replace
    assets/images/logo-mark.png with the real file when it is to hand.
    """
    # Drawn at 4x and downsampled so the curves are smooth at header size.
    S = 4
    w, h = width * S, height * S
    img = Image.new("RGBA", (w, h), TURQUOISE)
    d = ImageDraw.Draw(img)
    stroke = max(2, int(h * 0.072))

    def ring(cx, cy, r):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PAPER, width=stroke)

    def arc(cx, cy, r, start, end):
        d.arc([cx - r, cy - r, cx + r, cy + r], start=start, end=end, fill=PAPER, width=stroke)

    # The open arc, in from the left edge: PIL measures clockwise from 3
    # o'clock, so 110 to 290 draws the left side and over the top, leaving the
    # lower right open.
    arc(w * 0.168, h * 0.440, h * 0.255, 110, 290)

    # The smaller lens, dropped below and overlapping the arc.
    ring(w * 0.278, h * 0.660, h * 0.215)

    # The largest lens, high and to the right.
    ring(w * 0.408, h * 0.395, h * 0.295)

    return img.resize((width, height), Image.LANCZOS)


def wordmark(width: int, height: int, on_dark: bool = False) -> Image.Image:
    """"surreyopticians" as one lowercase word, navy then turquoise."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    first = PAPER if on_dark else INK
    second = PAPER if on_dark else TURQUOISE

    f = font("Inter-Regular.ttf", int(width * 0.118))
    a, b = "surrey", "opticians"
    wa, wb = d.textlength(a, font=f), d.textlength(b, font=f)
    x = (width - (wa + wb)) / 2
    y = height / 2
    d.text((x, y), a, font=f, fill=first, anchor="lm")
    d.text((x + wa, y), b, font=f, fill=second, anchor="lm")
    return img


def main() -> None:
    # iOS icon — no transparency allowed, so the turquoise field is baked in.
    monogram(1024, TURQUOISE, PAPER).convert("RGB").save(OUT / "icon.png")

    # Android adaptive foreground: transparent, mark kept inside the safe zone
    # because the launcher masks and moves it.
    layer = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    layer.paste(monogram(560, None, PAPER), (232, 232), monogram(560, None, PAPER))
    layer.save(OUT / "adaptive-icon.png")

    # Splash: the wordmark on transparent, over the white set in app.json.
    splash = Image.new("RGBA", (900, 900), (0, 0, 0, 0))
    mark = wordmark(820, 260)
    splash.paste(mark, (40, 320), mark)
    splash.save(OUT / "splash-image.png")

    monogram(196, TURQUOISE, PAPER).convert("RGB").save(OUT / "favicon.png")

    # The mark shown in the app's own headers: the turquoise tile with the
    # white interlocking-lens motif, in the logo's own landscape proportions.
    # Kept as its own file so the practice's real artwork can replace just this
    # one, without touching the store icon or the splash.
    tile(980, 400).save(OUT / "logo-mark.png")

    for n in ("icon.png", "adaptive-icon.png", "splash-image.png", "favicon.png", "logo-mark.png"):
        p = OUT / n
        print(f"  {n:20} {Image.open(p).size}  {p.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
