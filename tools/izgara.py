"""Kaba köşe işaretlemek için ızgaralı önizleme üretir (koordinatlar orijinal piksel)."""
import sys, cv2
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from hazirla import oku, yaz
olcek = 0.5
for s in sys.argv[1:]:
    img = oku(Path("raw")/f"{s}.jpg"); h, w = img.shape[:2]
    k = cv2.resize(img, None, fx=olcek, fy=olcek)
    for x in range(0, w, 100):
        c = (0,0,255) if x % 500 == 0 else (0,200,255)
        cv2.line(k, (int(x*olcek),0), (int(x*olcek),k.shape[0]), c, 1)
        cv2.putText(k, str(x), (int(x*olcek)+2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,0,255), 1)
    for y in range(0, h, 100):
        c = (0,0,255) if y % 500 == 0 else (0,200,255)
        cv2.line(k, (0,int(y*olcek)), (k.shape[1],int(y*olcek)), c, 1)
        cv2.putText(k, str(y), (2, int(y*olcek)-2), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,0,255), 1)
    yaz(Path("raw/_debug")/f"{s}-izgara.jpg", k)
