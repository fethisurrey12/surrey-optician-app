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

TURQUOISE = (0, 157, 177, 255)    # brand Turquoise #009db1, from the Lookbook
INK = (59, 60, 67, 255)           # brand Dark Grey #3b3c43
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
    """The turquoise tile with the white SO monogram.

    Traced against the practice's own Surrey Opticians Logo-01.png: a large O
    filling most of the tile's height, set left of centre, with a smaller S
    tucked into its lower left — an open upper bowl running out to the tile's
    edge and a lower loop that drops past the tile's foot. The right of the
    tile is empty, as theirs is.

    A trace, not the artwork. The practice's own file lives in SharePoint at
    SOMarketing / Surrey Opticians Logo-01.png; dropping it in over
    assets/images/logo-mark.png replaces this with the real thing.
    """
    # Drawn at 4x and downsampled so the curves are smooth at header size.
    F = 4
    w, h = width * F, height * F
    img = Image.new("RGBA", (w, h), TURQUOISE)
    d = ImageDraw.Draw(img)
    stroke = max(2, int(h * 0.090))

    def arc(cx, cy, r, start, end):
        d.arc([cx - r, cy - r, cx + r, cy + r], start=start, end=end, fill=PAPER, width=stroke)

    # The O — large, high, left of centre.
    arc(w * 0.330, h * 0.345, h * 0.430, 0, 360)

    # The S, upper bowl: runs out to the tile's left edge, open at its foot.
    arc(w * 0.072, h * 0.500, h * 0.215, 170, 40)

    # The S, lower loop: drops past the tile's foot, open at its head.
    arc(w * 0.180, h * 0.810, h * 0.200, 330, 200)

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
    tile(1032, 400).save(OUT / "logo-mark.png")

    for n in ("icon.png", "adaptive-icon.png", "splash-image.png", "favicon.png", "logo-mark.png"):
        p = OUT / n
        print(f"  {n:20} {Image.open(p).size}  {p.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
