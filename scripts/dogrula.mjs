// Build öncesi içerik kontrolü: kimlikler, kutular ve dosyalar tutarlı mı?
import fs from "node:fs";
import path from "node:path";

const kok = process.cwd();
const kitap = JSON.parse(fs.readFileSync(path.join(kok, "content", "kitap.json"), "utf8"));
const hatalar = [];
const uyarilar = [];

for (const { slug } of kitap.sayfalar) {
  const dosya = path.join(kok, "content", slug, "ulke.json");
  if (!fs.existsSync(dosya)) continue;
  const u = JSON.parse(fs.readFileSync(dosya, "utf8"));
  const yer = (m) => `${slug}: ${m}`;
  const varMi = (p) => fs.existsSync(path.join(kok, "public", p));

  if (!varMi(`img/${slug}/poster-1600.webp`)) hatalar.push(yer("poster-1600.webp yok (tools/hazirla.py)"));

  const ogeIdler = new Set();
  for (const o of u.ogeler) {
    if (ogeIdler.has(o.id)) hatalar.push(yer(`tekrarlanan nesne kimliği ${o.id}`));
    ogeIdler.add(o.id);
    for (const [ad, k] of [["kutu", o.kutu], ["kesik", o.kesik]]) {
      if (!k) continue;
      if (k.x < 0 || k.y < 0 || k.x + k.w > 1.001 || k.y + k.h > 1.001) hatalar.push(yer(`${o.id}.${ad} poster dışına taşıyor`));
    }
    if (o.efekt) {
      if (!varMi(`img/${slug}/oge-${o.id}.webp`)) hatalar.push(yer(`${o.id} kesiği yok (tools/kes.py ${slug})`));
      if (!varMi(`img/${slug}/oge-${o.id}-alt.webp`)) hatalar.push(yer(`${o.id} alt katmanı yok (tools/kes.py ${slug})`));
    }
  }

  const adimIdler = new Set();
  for (const a of u.adimlar) {
    if (adimIdler.has(a.id)) hatalar.push(yer(`tekrarlanan adım ${a.id}`));
    adimIdler.add(a.id);
    if (a.odak !== "tum" && !ogeIdler.has(a.odak)) hatalar.push(yer(`${a.id}: odak "${a.odak}" diye nesne yok`));
    for (const e of a.efektler ?? []) if (!ogeIdler.has(e)) hatalar.push(yer(`${a.id}: efekt nesnesi "${e}" yok`));
    for (const r of a.ara ?? []) {
      if (r.odak && !ogeIdler.has(r.odak)) hatalar.push(yer(`${a.id}: ara odak "${r.odak}" yok`));
      const okunan = a.okunus ?? a.metin;
      if (!okunan.toLocaleLowerCase("tr").includes(r.kelime.toLocaleLowerCase("tr")))
        hatalar.push(yer(`${a.id}: ara kelimesi "${r.kelime}" okunan metinde geçmiyor`));
    }
    if (a.sahne) {
      const hedef = u.ogeler.find((o) => o.id === a.odak);
      if (!hedef?.efekt) hatalar.push(yer(`${a.id}: sahne için "${a.odak}" nesnesinin kesiği gerekli (efekt tanımla)`));
    }
    if (!varMi(`ses/${slug}/${a.id}.mp3`)) uyarilar.push(yer(`${a.id}.mp3 yok (tools/tts.py ${slug}); tarayıcı sesi kullanılır`));
  }
}

for (const u of uyarilar) console.warn("uyarı:", u);
if (hatalar.length) {
  for (const h of hatalar) console.error("HATA:", h);
  process.exit(1);
}
console.log("içerik tamam");
