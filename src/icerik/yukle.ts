import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Ulke } from "./sema";

const CONTENT = path.join(process.cwd(), "content");

type Konum = [number, number];

export type KitapSayfasi = {
  slug: string;
  ad: string;
  kisa: string;
  iso: string;
  bayrak: string;
  baskent: string;
  konum: Konum;
  etiket: [number, number];
  hazir: boolean;
  /** Poster zemin rengi (hazirla.py ölçer). */
  renk: string | null;
  posterVar: boolean;
};

export type Kitap = {
  baslik: string;
  hazirlayan: string;
  baslangic: { ad: string; iso: string; bayrak: string; konum: Konum };
  sayfalar: KitapSayfasi[];
};

function okuJson<T>(dosya: string): T {
  return JSON.parse(fs.readFileSync(dosya, "utf8")) as T;
}

export function kitap(): Kitap {
  const k = okuJson<Omit<Kitap, "hazirlayan" | "sayfalar"> & { sayfalar: Omit<KitapSayfasi, "hazir" | "renk" | "posterVar">[] }>(
    path.join(CONTENT, "kitap.json"),
  );
  const ayar = okuJson<{ hazirlayan?: string }>(path.join(CONTENT, "ayarlar.json"));
  return {
    baslik: k.baslik,
    hazirlayan: ayar.hazirlayan ?? "",
    baslangic: k.baslangic,
    sayfalar: k.sayfalar.map((s) => {
      const posterBilgi = path.join(CONTENT, s.slug, "_poster.json");
      return {
        ...s,
        hazir: fs.existsSync(path.join(CONTENT, s.slug, "ulke.json")),
        renk: fs.existsSync(posterBilgi) ? okuJson<{ zemin: string }>(posterBilgi).zemin : null,
        posterVar: fs.existsSync(path.join(process.cwd(), "public", "img", s.slug, "poster-1600.webp")),
      };
    }),
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
