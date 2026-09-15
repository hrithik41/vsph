from PIL import Image
import sys

img = Image.open('static/assets/hero-banner.png')
img = img.convert("RGBA")
width, height = img.size

# Check a few pixels on the left edge
pixels = [
    img.getpixel((0, 0)),
    img.getpixel((0, height//2)),
    img.getpixel((0, height-1))
]
print(f"Size: {width}x{height}")
print(f"Left edge pixels (RGBA): {pixels}")
