"""Ham sayfa fotoğrafından posteri bulur, perspektifini düzeltir, beyaz dengesini ayarlar.

Kullanım:  tools/.venv/Scripts/python.exe tools/hazirla.py abd [--debug]
Çıktılar:  public/img/<slug>/poster-1600.webp, poster-2400.webp (kaynak yetiyorsa),
           public/img/<slug>/sayfa.webp (tüm sayfa, küçük), content/<slug>/_poster.json (boyut + zemin rengi)
Elle köşe: raw/koseler.json -> {"abd": {"poster": [[x,y],[x,y],[x,y],[x,y]]}} (sol-üst, sağ-üst, sağ-alt, sol-alt)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

KOK = Path(__file__).resolve().parent.parent
RAW = KOK / "raw"
PUBLIC = KOK / "public" / "img"
CONTENT = KOK / "content"
KAGIT_HEDEF = np.array([247.0, 248.0, 245.0])  # BGR: hafif soğuk kâğıt beyazı


# cv2.imread/imwrite Windows'ta ASCII olmayan yolları (Masaüstü) açamıyor
def oku(yol: Path) -> np.ndarray | None:
    if not yol.exists():
        return None
    return cv2.imdecode(np.fromfile(str(yol), dtype=np.uint8), cv2.IMREAD_COLOR)


def yaz(yol: Path, img: np.ndarray, parametre: list[int] | None = None) -> None:
    yol.parent.mkdir(parents=True, exist_ok=True)
    ok, buf = cv2.imencode(yol.suffix, img, parametre or [])
    if not ok:
        raise RuntimeError(f"Yazılamadı: {yol}")
    buf.tofile(str(yol))


def kose_sirala(pts: np.ndarray) -> np.ndarray:
    pts = pts.reshape(4, 2).astype(np.float32)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], dtype=np.float32)


def dortgen_bul(maske: np.ndarray) -> np.ndarray | None:
    konturlar, _ = cv2.findContours(maske, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not konturlar:
        return None
    k = max(konturlar, key=cv2.contourArea)
    if cv2.contourArea(k) < maske.size * 0.08:
        return None
    hull = cv2.convexHull(k)
    cevre = cv2.arcLength(hull, True)
    for oran in (0.01, 0.015, 0.02, 0.03, 0.04, 0.05):
        yaklasik = cv2.approxPolyDP(hull, oran * cevre, True)
        if len(yaklasik) == 4:
            return kose_sirala(yaklasik)
    return kose_sirala(cv2.boxPoints(cv2.minAreaRect(hull)))


def sayfa_maskesi(img: np.ndarray) -> np.ndarray:
    """Kâğıt: parlak ve düşük doygunluklu. Halı bej olduğu için doygunluk eşiği sıkı."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    s, v = hsv[..., 1], hsv[..., 2]
    m = ((v > 175) & (s < 38)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    return m


def poster_maskesi(img: np.ndarray, sayfa: np.ndarray) -> np.ndarray:
    """Poster: sayfanın içinde kalan, kâğıt olmayan büyük blok."""
    sayfa_dortgen = dortgen_bul(sayfa)
    ic = np.zeros(sayfa.shape, np.uint8)
    if sayfa_dortgen is not None:
        cv2.fillConvexPoly(ic, sayfa_dortgen.astype(np.int32), 255)
        ic = cv2.erode(ic, np.ones((25, 25), np.uint8))
    else:
        ic[:] = 255
    kagit_degil = cv2.bitwise_not(sayfa)
    m = cv2.bitwise_and(kagit_degil, ic)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((41, 41), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((31, 31), np.uint8))
    return m


def kose_incelt(img: np.ndarray, kaba: np.ndarray, ara: int = 45) -> np.ndarray:
    """Kaba köşeleri, her kenar boyunca kâğıt→poster geçişinin en keskin olduğu çizgiye oturtur."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    kagitlik = hsv[..., 2] / 255.0 - 1.6 * hsv[..., 1] / 255.0  # kâğıtta yüksek, posterde düşük
    kagitlik = cv2.GaussianBlur(kagitlik, (5, 5), 0)
    h, w = kagitlik.shape
    merkez = kaba.mean(axis=0)
    cizgiler = []
    for i in range(4):
        a, b = kaba[i], kaba[(i + 1) % 4]
        yon = (b - a) / np.linalg.norm(b - a)
        normal = np.array([-yon[1], yon[0]])
        if np.dot(merkez - (a + b) / 2, normal) > 0:  # normal dışarıyı göstersin
            normal = -normal
        noktalar = []
        for t in np.linspace(0.06, 0.94, 80):
            p = a + (b - a) * t
            adim = np.arange(-ara, ara + 1)
            xs = np.clip((p[0] + normal[0] * adim).round().astype(int), 0, w - 1)
            ys = np.clip((p[1] + normal[1] * adim).round().astype(int), 0, h - 1)
            profil = kagitlik[ys, xs]  # içten dışa
            turev = np.diff(profil)
            j = int(np.argmax(turev))
            if turev[j] > 0.12:
                noktalar.append(p + normal * (adim[j] + 0.5))
        if len(noktalar) < 15:
            cizgiler.append((a, yon))
            continue
        vx, vy, x0, y0 = cv2.fitLine(np.array(noktalar, np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        cizgiler.append((np.array([x0, y0]), np.array([vx, vy])))
    yeni = []
    for i in range(4):
        (p1, d1), (p2, d2) = cizgiler[(i - 1) % 4], cizgiler[i]
        A = np.array([d1, -d2]).T
        s = np.linalg.solve(A, p2 - p1)
        yeni.append(p1 + d1 * s[0])
    return np.array(yeni, dtype=np.float32)


def duzelt(img: np.ndarray, koseler: np.ndarray) -> np.ndarray:
    sol_ust, sag_ust, sag_alt, sol_alt = koseler
    gen = int(max(np.linalg.norm(sag_ust - sol_ust), np.linalg.norm(sag_alt - sol_alt)))
    yuk = int(max(np.linalg.norm(sol_alt - sol_ust), np.linalg.norm(sag_alt - sag_ust)))
    hedef = np.array([[0, 0], [gen - 1, 0], [gen - 1, yuk - 1], [0, yuk - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(koseler, hedef)
    return cv2.warpPerspective(img, M, (gen, yuk), flags=cv2.INTER_CUBIC)


def beyaz_dengesi(img: np.ndarray, sayfa: np.ndarray, poster_m: np.ndarray) -> np.ndarray:
    kagit = cv2.bitwise_and(sayfa, cv2.bitwise_not(cv2.dilate(poster_m, np.ones((31, 31), np.uint8))))
    piksel = img[kagit > 0]
    if len(piksel) < 1000:
        return img
    ref = np.percentile(piksel, 60, axis=0)
    kazanc = np.clip(KAGIT_HEDEF / np.maximum(ref, 1), 1.0, 1.5)
    return np.clip(img.astype(np.float32) * kazanc, 0, 255).astype(np.uint8)


def kirp_kenar(img: np.ndarray, pay: float = 0.006, ek: dict | None = None) -> np.ndarray:
    """Köşe tahminindeki küçük hataları gizlemek için kenardan ince bir pay kırp.
    ek = {"sol": 0.02, ...} sayfaya özel ek kırpma (örn. posterin üstüne gelen spiral delikleri)."""
    ek = ek or {}
    h, w = img.shape[:2]
    ust, alt = int(h * (pay + ek.get("ust", 0))), int(h * (pay + ek.get("alt", 0)))
    sol, sag = int(w * (pay + ek.get("sol", 0))), int(w * (pay + ek.get("sag", 0)))
    return img[ust : h - alt, sol : w - sag]


def zemin_rengi(poster: np.ndarray) -> str:
    h, w = poster.shape[:2]
    bant = max(4, int(min(h, w) * 0.025))
    kenar = np.concatenate(
        [poster[:bant].reshape(-1, 3), poster[-bant:].reshape(-1, 3), poster[:, :bant].reshape(-1, 3), poster[:, -bant:].reshape(-1, 3)]
    )
    b, g, r = np.median(kenar, axis=0).astype(int)
    return f"#{r:02x}{g:02x}{b:02x}"


def bant_temizle(img: np.ndarray, bant: dict) -> np.ndarray:
    """Görselin üstüne yapıştırılmış bandı (örn. isim etiketi) kapatır: bölge çevredeki gök rengiyle
    doldurulur, sonra görseldeki gerçek bir bulut kopyalanıp Poisson karışımıyla yerleştirilir.
    bant = {"kutu": [x0,y0,x1,y1], "bulut": [x0,y0,x1,y1], "olcek": 1.1}  (hepsi oran)"""
    h, w = img.shape[:2]
    x0, y0, x1, y1 = (int(v * (w if i % 2 == 0 else h)) for i, v in enumerate(bant["kutu"]))
    pay = max(6, int(0.015 * w))
    dis = np.concatenate([img[y0:y1, max(0, x0 - pay):x0].reshape(-1, 3), img[y0:y1, x1:x1 + pay].reshape(-1, 3),
                          img[y1:y1 + pay, x0:x1].reshape(-1, 3)]).astype(np.float32)
    dis_l = dis.mean(axis=1)
    gok = np.median(dis[dis_l < np.percentile(dis_l, 50)], axis=0)
    sonuc = img.copy()
    sonuc[y0:y1, x0:x1] = gok.astype(np.uint8)
    # kenarı çevreyle kaynaştır
    kenar = np.zeros((h, w), np.uint8)
    cv2.rectangle(kenar, (x0 - 3, y0 - 3), (x1 + 3, y1 + 3), 255, 8)
    sonuc = cv2.inpaint(sonuc, kenar, 5, cv2.INPAINT_TELEA)

    if "bulut" in bant:
        bx0, by0, bx1, by1 = (int(v * (w if i % 2 == 0 else h)) for i, v in enumerate(bant["bulut"]))
        kaynak = img[by0:by1, bx0:bx1]
        olcek = bant.get("olcek", 1.0)
        kaynak = cv2.resize(kaynak, None, fx=olcek, fy=olcek, interpolation=cv2.INTER_CUBIC)
        hsv = cv2.cvtColor(kaynak, cv2.COLOR_BGR2HSV)
        maske = ((hsv[..., 2] > np.percentile(hsv[..., 2], 55)) & (hsv[..., 1] < 70)).astype(np.uint8) * 255
        maske = cv2.morphologyEx(maske, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        maske = cv2.dilate(maske, np.ones((9, 9), np.uint8))
        maske[:2], maske[-2:], maske[:, :2], maske[:, -2:] = 0, 0, 0, 0
        merkez = ((x0 + x1) // 2, max(kaynak.shape[0] // 2 + 2, (y0 + y1) // 2))
        sonuc = cv2.seamlessClone(kaynak, sonuc, maske, merkez, cv2.NORMAL_CLONE)
    return sonuc


def og_yaz(yol: Path, img: np.ndarray) -> None:
    """WhatsApp/sosyal önizleme: 1200x630, ortadan kırpılmış JPEG (WebP her yerde desteklenmiyor)."""
    h, w = img.shape[:2]
    hedef_oran = 1200 / 630
    if w / h > hedef_oran:
        yeni_w = int(h * hedef_oran)
        x = (w - yeni_w) // 2
        kirp = img[:, x : x + yeni_w]
    else:
        yeni_h = int(w / hedef_oran)
        y = (h - yeni_h) // 2
        kirp = img[y : y + yeni_h]
    yaz(yol, cv2.resize(kirp, (1200, 630), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])


def webp(yol: Path, img: np.ndarray, genislik: int, kalite: int = 84) -> None:
    h, w = img.shape[:2]
    if w > genislik:
        img = cv2.resize(img, (genislik, round(h * genislik / w)), interpolation=cv2.INTER_AREA)
    yaz(yol, img, [cv2.IMWRITE_WEBP_QUALITY, kalite])


def isle(slug: str, debug: bool) -> None:
    kaynak = RAW / f"{slug}.jpg"
    img = oku(kaynak)
    if img is None:
        sys.exit(f"Bulunamadı: {kaynak}")

    sayfa = sayfa_maskesi(img)
    poster_m = poster_maskesi(img, sayfa)

    elle = {}
    kose_dosya = RAW / "koseler.json"
    if kose_dosya.exists():
        elle = json.loads(kose_dosya.read_text(encoding="utf-8")).get(slug, {})
    if "poster" in elle:
        koseler = np.array(elle["poster"], dtype=np.float32)
    elif "kaba" in elle:
        koseler = kose_incelt(img, np.array(elle["kaba"], dtype=np.float32))
    else:
        koseler = dortgen_bul(poster_m)
    if koseler is None:
        sys.exit(f"{slug}: poster bulunamadı, raw/koseler.json ile elle köşe ver.")
    poster_m = np.zeros(img.shape[:2], np.uint8)
    cv2.fillConvexPoly(poster_m, koseler.astype(np.int32), 255)

    dengeli = beyaz_dengesi(img, sayfa, poster_m)
    # "gizle": [[x0,y0,x1,y1], ...] bölgelerdeki koyu kalem izlerini sil (örn. kapaktaki öğrenci adı)
    for x0, y0, x1, y1 in elle.get("gizle", []):
        bolge = dengeli[y0:y1, x0:x1]
        parlaklik = cv2.cvtColor(bolge, cv2.COLOR_BGR2HSV)[..., 2]
        iz = (parlaklik < 115).astype(np.uint8) * 255  # kalem izi koyu; gökyüzü ve bulut açık
        iz = cv2.dilate(iz, np.ones((5, 5), np.uint8))
        dengeli[y0:y1, x0:x1] = cv2.inpaint(bolge, iz, 7, cv2.INPAINT_TELEA)
    poster = kirp_kenar(duzelt(dengeli, koseler), ek=elle.get("kirp"))
    h, w = poster.shape[:2]
    for bant in elle.get("bant", []):
        poster = bant_temizle(poster, bant)

    hedef = PUBLIC / slug
    ad = "kapak" if slug == "kapak" else "poster"
    webp(hedef / f"{ad}-1600.webp", poster, 1600)
    if w >= 2000:
        webp(hedef / f"{ad}-2400.webp", poster, 2400)
    if slug != "kapak":
        webp(hedef / "sayfa.webp", dengeli, 1200, 80)
    og_yaz(hedef / "og.jpg", poster)

    CONTENT.joinpath(slug).mkdir(parents=True, exist_ok=True)
    bilgi = {"kaynakGenislik": w, "kaynakYukseklik": h, "oran": round(w / h, 4), "zemin": zemin_rengi(poster),
             "koseler": koseler.round(1).tolist()}
    (CONTENT / slug / "_poster.json").write_text(json.dumps(bilgi, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{slug}: poster {w}x{h} oran {bilgi['oran']} zemin {bilgi['zemin']}")

    if debug:
        dbg = img.copy()
        cv2.polylines(dbg, [koseler.astype(np.int32)], True, (0, 0, 255), 4)
        d = KOK / "raw" / "_debug"
        d.mkdir(exist_ok=True)
        yaz(d / f"{slug}-koseler.jpg", cv2.resize(dbg, None, fx=0.5, fy=0.5))
        yaz(d / f"{slug}-poster-mask.png", cv2.resize(poster_m, None, fx=0.5, fy=0.5))


if __name__ == "__main__":
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    hepsi = argv or [p.stem for p in RAW.glob("*.jpg") if p.stem != "kapak"]
    for s in hepsi:
        isle(s, "--debug" in sys.argv)
