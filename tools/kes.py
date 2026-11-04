"""Efekti olan her nesneyi posterden keser.

Her nesne için iki dosya:
  oge-<id>.webp      saydam arka planlı kesik (hareket eden katman)
  oge-<id>-alt.webp  aynı bölgenin nesnesi silinmiş (inpaint) hali; nesne yerinden oynarken altını örter
Arka plan tahmini: kesik kutusunun kenar halkasındaki renkler arka plan sayılır; kenara bağlı ve bu
renklere yakın pikseller silinir. Düz zeminli posterlerde (krem kara, düz deniz) iyi çalışır.

Kullanım: tools/.venv/Scripts/python.exe tools/kes.py abd [--debug]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from hazirla import oku, yaz  # noqa: E402

KOK = Path(__file__).resolve().parent.parent


def arka_plan_maskesi(lab: np.ndarray, esik: float) -> np.ndarray:
    h, w = lab.shape[:2]
    halka = max(3, int(min(h, w) * 0.04))
    kenar = np.concatenate([lab[:halka].reshape(-1, 3), lab[-halka:].reshape(-1, 3),
                            lab[:, :halka].reshape(-1, 3), lab[:, -halka:].reshape(-1, 3)]).astype(np.float32)
    k = min(4, len(kenar))
    _, _, merkezler = cv2.kmeans(kenar, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3,
                                 cv2.KMEANS_PP_CENTERS)
    duz = lab.reshape(-1, 3).astype(np.float32)
    uzaklik = np.min(np.linalg.norm(duz[:, None, :] - merkezler[None, :, :], axis=2), axis=1).reshape(h, w)
    benzer = (uzaklik < esik).astype(np.uint8)
    # yalnızca kenara bağlı benzer bölgeler arka plan
    n, etiket = cv2.connectedComponents(benzer, connectivity=4)
    kenar_etiket = set(np.unique(np.concatenate([etiket[0], etiket[-1], etiket[:, 0], etiket[:, -1]]))) - {0}
    arka = np.isin(etiket, list(kenar_etiket)) & (benzer > 0)
    return arka.astype(np.uint8) * 255


def kes(slug: str, debug: bool) -> None:
    veri = json.loads((KOK / "content" / slug / "ulke.json").read_text(encoding="utf-8"))
    poster = oku(KOK / "public" / "img" / slug / "poster-1600.webp")
    H, W = poster.shape[:2]
    hedef = KOK / "public" / "img" / slug
    for oge in veri["ogeler"]:
        if "efekt" not in oge:
            continue
        k = oge.get("kesik") or oge["kutu"]
        x0, y0 = int(k["x"] * W), int(k["y"] * H)
        x1, y1 = min(W, int((k["x"] + k["w"]) * W)), min(H, int((k["y"] + k["h"]) * H))
        parca = poster[y0:y1, x0:x1]
        lab = cv2.cvtColor(parca, cv2.COLOR_BGR2LAB)
        arka = arka_plan_maskesi(lab, esik=oge.get("_esik", 16.0))
        nesne = cv2.bitwise_not(arka)
        nesne = cv2.morphologyEx(nesne, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        nesne = cv2.morphologyEx(nesne, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        # küçük kırıntıları at, en büyük parçaya göre %3'ten küçükleri sil
        n, et, st, _ = cv2.connectedComponentsWithStats(nesne)
        if n > 1:
            en_buyuk = st[1:, cv2.CC_STAT_AREA].max()
            for i in range(1, n):
                if st[i, cv2.CC_STAT_AREA] < en_buyuk * 0.03:
                    nesne[et == i] = 0
        # delikleri doldur (nesnenin içindeki arka plan renkli bölgeler nesneye ait)
        dolu = nesne.copy()
        konturlar, _ = cv2.findContours(nesne, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(dolu, konturlar, -1, 255, -1)
        alfa = cv2.GaussianBlur(dolu, (3, 3), 0)
        rgba = np.dstack([parca, alfa])
        yaz(hedef / f"oge-{oge['id']}.webp", rgba, [cv2.IMWRITE_WEBP_QUALITY, 90])

        # Alt katman: nesne (ve gölgesi) baskın zemin rengiyle doldurulur, kenar geçişi inpaint ile yumuşatılır
        genis = cv2.dilate(dolu, np.ones((13, 13), np.uint8))
        zemin_piksel = parca[(arka > 0) & (genis == 0)]
        zemin = np.median(zemin_piksel, axis=0) if len(zemin_piksel) > 50 else np.median(parca.reshape(-1, 3), axis=0)
        alt = parca.copy()
        alt[genis > 0] = zemin.astype(np.uint8)
        kenar_bandi = cv2.subtract(cv2.dilate(genis, np.ones((5, 5), np.uint8)), cv2.erode(genis, np.ones((5, 5), np.uint8)))
        alt = cv2.inpaint(alt, kenar_bandi, 3, cv2.INPAINT_TELEA)
        yaz(hedef / f"oge-{oge['id']}-alt.webp", alt, [cv2.IMWRITE_WEBP_QUALITY, 88])
        print(f"{slug}/{oge['id']}: {x1 - x0}x{y1 - y0}, nesne %{100 * (dolu > 0).mean():.0f}")

        if debug:
            d = KOK / "raw" / "_debug"
            onizleme = parca.copy()
            onizleme[dolu == 0] = (onizleme[dolu == 0] * 0.25 + np.array([255, 0, 255]) * 0.75).astype(np.uint8)
            yaz(d / f"kes-{slug}-{oge['id']}.jpg", np.hstack([onizleme, alt]))


if __name__ == "__main__":
    for s in [a for a in sys.argv[1:] if not a.startswith("--")]:
        kes(s, "--debug" in sys.argv)
