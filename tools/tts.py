"""Her tur adımı için Türkçe mp3 + kelime zamanlaması üretir (Microsoft Edge doğal sesleri, edge-tts).

Kullanım:
  tools/.venv/Scripts/python.exe tools/tts.py            # tüm ülkeler, sadece değişen adımlar
  tools/.venv/Scripts/python.exe tools/tts.py abd        # tek ülke
  tools/.venv/Scripts/python.exe tools/tts.py --ornek    # iki sesten örnek (public/ses/_ornek)
Ayar: content/ayarlar.json -> {"ses": "tr-TR-EmelNeural", "hiz": "-8%"}
Çıktı: public/ses/<slug>/<adimId>.mp3 ve <adimId>.json ([{ "w": kelime, "t": ms, "d": ms }])
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

KOK = Path(__file__).resolve().parent.parent
CONTENT = KOK / "content"
SES = KOK / "public" / "ses"


def ayarlar() -> dict:
    p = CONTENT / "ayarlar.json"
    d = {"ses": "tr-TR-EmelNeural", "hiz": "-8%"}
    if p.exists():
        d.update(json.loads(p.read_text(encoding="utf-8")).get("tts", {}))
    return d


async def uret(metin: str, ses: str, hiz: str, mp3: Path) -> list[dict]:
    iletisim = edge_tts.Communicate(metin, ses, rate=hiz, boundary="WordBoundary")
    kelimeler: list[dict] = []
    mp3.parent.mkdir(parents=True, exist_ok=True)
    with open(mp3, "wb") as f:
        async for parca in iletisim.stream():
            if parca["type"] == "audio":
                f.write(parca["data"])
            elif parca["type"] == "WordBoundary":
                kelimeler.append({"w": parca["text"], "t": round(parca["offset"] / 10_000), "d": round(parca["duration"] / 10_000)})
    return kelimeler


async def ulke(slug: str, ayar: dict) -> None:
    veri = json.loads((CONTENT / slug / "ulke.json").read_text(encoding="utf-8"))
    hedef = SES / slug
    hash_dosya = hedef / "_hash.json"
    eski = json.loads(hash_dosya.read_text(encoding="utf-8")) if hash_dosya.exists() else {}
    yeni = {}
    for adim in veri["adimlar"]:
        metin = adim.get("okunus") or adim["metin"]
        h = hashlib.sha1(f"{ayar['ses']}|{ayar['hiz']}|{metin}".encode()).hexdigest()[:12]
        yeni[adim["id"]] = h
        mp3 = hedef / f"{adim['id']}.mp3"
        if eski.get(adim["id"]) == h and mp3.exists():
            continue
        for deneme in range(3):
            try:
                kelimeler = await uret(metin, ayar["ses"], ayar["hiz"], mp3)
                break
            except Exception as e:  # ağ hatası olabilir
                if deneme == 2:
                    raise
                print(f"  tekrar ({e})")
                await asyncio.sleep(2)
        (hedef / f"{adim['id']}.json").write_text(json.dumps(kelimeler, ensure_ascii=False), encoding="utf-8")
        print(f"{slug}/{adim['id']}: {len(kelimeler)} kelime")
    hash_dosya.write_text(json.dumps(yeni, indent=1), encoding="utf-8")


async def ornek() -> None:
    metin = ("Amerika Birleşik Devletleri. Başkenti Washington, dili Amerikan İngilizcesi. "
             "New York'taki Özgürlük Heykeli, özgürlüğün simgesi olarak dünyaca ünlüdür.")
    for ses in ("tr-TR-EmelNeural", "tr-TR-AhmetNeural"):
        await uret(metin, ses, "-8%", SES / "_ornek" / f"{ses}.mp3")
        print("örnek:", ses)


if __name__ == "__main__":
    if "--ornek" in sys.argv:
        asyncio.run(ornek())
    else:
        ayar = ayarlar()
        secili = [a for a in sys.argv[1:] if not a.startswith("--")]
        hepsi = secili or sorted(p.name for p in CONTENT.iterdir() if (p / "ulke.json").exists())
        for s in hepsi:
            asyncio.run(ulke(s, ayar))
