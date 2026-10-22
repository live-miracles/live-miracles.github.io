#!/usr/bin/env python3
"""Shrink a blog image to a size budget by picking the highest quality that fits.

    optimize_image.py INPUT OUTPUT [--max-kb 100] [--width 1600]

OUTPUT's extension picks the format: .webp (screenshots, diagrams) or .jpg
(header images). Needs Pillow. Animated WebP is not handled here; see SKILL.md.
"""

import argparse
import io
import sys

from PIL import Image


def encode(image, fmt, quality):
    buffer = io.BytesIO()
    if fmt == "WEBP":
        image.save(buffer, "WEBP", quality=quality, method=6)
    else:
        image.save(buffer, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=0)
    return buffer.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--max-kb", type=int, default=100)
    parser.add_argument("--width", type=int, help="resize to this width first, keeping the ratio")
    args = parser.parse_args()

    ext = args.output.lower().rsplit(".", 1)[-1]
    fmt = {"webp": "WEBP", "jpg": "JPEG", "jpeg": "JPEG"}.get(ext)
    if not fmt:
        sys.exit("output must end in .webp or .jpg")

    image = Image.open(args.input).convert("RGB")
    if args.width and args.width < image.width:
        height = round(image.height * args.width / image.width)
        image = image.resize((args.width, height), Image.LANCZOS)

    limit = args.max_kb * 1024
    for quality in range(92, 29, -2):
        data = encode(image, fmt, quality)
        if len(data) <= limit:
            break
    else:
        sys.exit(f"still {len(data) // 1024} KB at quality 30; lower --width or simplify the image")

    with open(args.output, "wb") as out:
        out.write(data)
    print(f"{args.output}: {image.width}x{image.height}, quality {quality}, {len(data) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
