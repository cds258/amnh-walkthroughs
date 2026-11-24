# Contact sheet of screenshots: python3 tools/sheet.py out.jpg cols img1 img2 ...
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th = 640, 360
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + 150, y + 16], fill=(0, 0, 0))
    d.text((x + 4, y + 2), f.split('/')[-1].rsplit('.', 1)[0], fill=(255, 255, 0))
sheet.save(out, quality=85)
