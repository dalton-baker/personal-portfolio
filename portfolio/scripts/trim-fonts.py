"""
Builds the self-hosted fonts in src/lib/fonts from Google Fonts' Latin files.

Google serves each family as one variable font covering every weight (100-900). This keeps only the
weights the CSS uses (Geist 400-600 and Geist Mono 400-500 as smaller variable fonts, Unbounded as
static 800 and 600 files, since 600 only appears in post subheadings) and the Latin characters.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/trim-fonts.py

To pick up a new font version, take the `latin` URLs from
https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400..500&family=Unbounded:wght@600;800
(requested with a current browser user agent, so it answers with WOFF2).
"""
import io
import os
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SOURCES = {
    "geist": "https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2",
    "geist-mono": "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmg.woff2",
    "unbounded": "https://fonts.gstatic.com/s/unbounded/v12/Yq6W-LOTXCb04q32xlpwu8Zf.woff2",
}
# (source, output, weight): a (min, max) range keeps a variable font, a single weight makes a static one.
OUTPUTS = [
    ("geist", "geist.woff2", (400, 600)),
    ("geist-mono", "geist-mono.woff2", (400, 500)),
    ("unbounded", "unbounded-800.woff2", 800),
    ("unbounded", "unbounded-600.woff2", 600),
]
# Basic Latin, Latin-1 and the punctuation Google's Latin subset carries. Keep in sync with fonts.css.
UNICODES = (
    "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
    "U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215"
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "fonts")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as res:
        return res.read()


def trim(data, wght, out):
    font = instantiateVariableFont(TTFont(io.BytesIO(data)), {"wght": wght}, updateFontNames=False)
    # Round-trip so the subsetter sees fully loaded tables.
    buf = io.BytesIO()
    font.flavor = None
    font.save(buf)
    buf.seek(0)
    font = TTFont(buf)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    s = subset.Subsetter(opts)
    s.populate(unicodes=subset.parse_unicodes(UNICODES))
    s.subset(font)
    subset.save_font(font, out, opts)


if __name__ == "__main__":
    sources = {name: fetch(url) for name, url in SOURCES.items()}
    for src, name, wght in OUTPUTS:
        out = os.path.join(OUT_DIR, name)
        trim(sources[src], wght, out)
        print(f"{name}: {len(sources[src])} -> {os.path.getsize(out)} bytes")
