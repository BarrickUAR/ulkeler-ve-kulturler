// Kitapçığa yapıştırılacak QR kodlarını üretir: her hazır ülke için <site>/<slug> adresine giden bir QR.
// Kullanım:  npm run qr -- https://site-adresi.vercel.app
//            (adres verilmezse SITE_URL ortam değişkeni kullanılır)
// Çıktı:     qr/tumu.png (ana sayfa, tüm ülkeler), qr/<slug>.png ve qr/<slug>.svg, yazdırmak için qr/yazdir.html (A4, kesme çizgili kartlar)
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const kok = process.cwd();
const site = (process.argv[2] ?? process.env.SITE_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(site)) {
  console.error("Site adresi gerekli:  npm run qr -- https://site-adresi.vercel.app");
  process.exit(1);
}

const kitap = JSON.parse(fs.readFileSync(path.join(kok, "content", "kitap.json"), "utf8"));
const hazir = kitap.sayfalar
  .map((s, i) => ({ ...s, sira: i + 1 }))
  .filter((s) => fs.existsSync(path.join(kok, "content", s.slug, "ulke.json")));

const hedef = path.join(kok, "qr");
fs.mkdirSync(hedef, { recursive: true });

const ayar = { errorCorrectionLevel: "M", margin: 2, color: { dark: "#17295c", light: "#ffffff" } };
const kartlar = [];

// Tüm kitapçığı (ana sayfa: rota + bütün ülkeler) açan tek QR
await QRCode.toFile(path.join(hedef, "tumu.png"), `${site}/`, { ...ayar, width: 1000 });
const tumuSvg = await QRCode.toString(`${site}/`, { ...ayar, type: "svg" });
fs.writeFileSync(path.join(hedef, "tumu.svg"), tumuSvg);
kartlar.push(`<figure class="kart tumu">${tumuSvg}<figcaption><b>Tüm ülkeler</b><span>Okut, yolculuğa başla!</span></figcaption></figure>`);
console.log(`tumu: ${site}/`);

for (const s of hazir) {
  const adres = `${site}/${s.slug}`;
  await QRCode.toFile(path.join(hedef, `${s.slug}.png`), adres, { ...ayar, width: 600 });
  const svg = await QRCode.toString(adres, { ...ayar, type: "svg" });
  fs.writeFileSync(path.join(hedef, `${s.slug}.svg`), svg);
  kartlar.push(
    `<figure class="kart">${svg}<figcaption><b>${s.sira}. ${s.ad}</b><span>Okut, dinle!</span></figcaption></figure>`,
  );
  console.log(`${s.slug}: ${adres}`);
}

fs.writeFileSync(
  path.join(hedef, "yazdir.html"),
  `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>QR kodları</title><style>
@page { size: A4; margin: 12mm; }
body { font-family: system-ui, sans-serif; margin: 0; }
.izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
.kart { margin: 0; padding: 4mm; border: 1px dashed #999; text-align: center; break-inside: avoid; }
.kart svg { width: 42mm; height: 42mm; }
.tumu { grid-column: 1 / -1; border-style: solid; }
.tumu svg { width: 70mm; height: 70mm; }
figcaption { display: grid; gap: 1mm; font-size: 11pt; color: #17295c; }
figcaption span { font-size: 9pt; color: #555; }
</style></head><body><div class="izgara">${kartlar.join("\n")}</div></body></html>`,
);
console.log(`\n${hazir.length} QR kodu hazır: qr/ (yazdırmak için qr/yazdir.html)`);
