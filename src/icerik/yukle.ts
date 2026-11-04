import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Ulke } from "./sema";

const CONTENT = path.join(process.cwd(), "content");

export type KitapSayfasi = { slug: string; ad: string; hazir: boolean };

function okuJson<T>(dosya: string): T {
  return JSON.parse(fs.readFileSync(dosya, "utf8")) as T;
}

export function kitap(): { baslik: string; hazirlayan: string; sayfalar: KitapSayfasi[] } {
  const k = okuJson<{ baslik: string; sayfalar: { slug: string; ad: string }[] }>(path.join(CONTENT, "kitap.json"));
  const ayar = okuJson<{ hazirlayan?: string }>(path.join(CONTENT, "ayarlar.json"));
  return {
    baslik: k.baslik,
    hazirlayan: ayar.hazirlayan ?? "",
    sayfalar: k.sayfalar.map((s) => ({ ...s, hazir: fs.existsSync(path.join(CONTENT, s.slug, "ulke.json")) })),
  };
}

export function ulke(slug: string): Ulke {
  const ham = okuJson<Record<string, unknown>>(path.join(CONTENT, slug, "ulke.json"));
  const poster = path.join(CONTENT, slug, "_poster.json");
  if (fs.existsSync(poster)) {
    // hazirla.py'nin ölçtüğü gerçek oran her zaman öncelikli
    const p = okuJson<{ oran: number }>(poster);
    ham.poster = { oran: p.oran };
  }
  return Ulke.parse(ham);
}

export function hazirUlkeler(): string[] {
  return kitap()
    .sayfalar.filter((s) => s.hazir)
    .map((s) => s.slug);
}
