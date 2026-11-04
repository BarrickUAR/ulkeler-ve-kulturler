"""Poster üstüne 0-1 oranlı ızgara çizer (nesne kutularını tahmin etmek için)."""
import sys, cv2
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from hazirla import oku, yaz
for s in sys.argv[1:]:
    img = oku(Path("public/img")/s/"poster-1600.webp")
    img = cv2.resize(img, (1200, round(img.shape[0]*1200/img.shape[1])))
    h, w = img.shape[:2]
    for i in range(1, 20):
        x, y = int(w*i/20), int(h*i/20)
        c = (0,0,255) if i % 2 == 0 else (0,220,255)
        cv2.line(img, (x,0), (x,h), c, 1); cv2.line(img, (0,y), (w,y), c, 1)
        if i % 2 == 0:
            cv2.putText(img, f"{i/20:.1f}", (x+2, 14), 0, 0.45, (255,255,255), 3); cv2.putText(img, f"{i/20:.1f}", (x+2, 14), 0, 0.45, (0,0,200), 1)
            cv2.putText(img, f"{i/20:.1f}", (2, y-3), 0, 0.45, (255,255,255), 3); cv2.putText(img, f"{i/20:.1f}", (2, y-3), 0, 0.45, (0,0,200), 1)
    yaz(Path("raw/_debug")/f"{s}-oran.jpg", img)
