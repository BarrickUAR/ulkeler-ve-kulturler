import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { Kelime } from "@/icerik/sema";
import { konumKarti } from "@/icerik/dunya";
import { hazirUlkeler, kitap, ulke as ulkeYukle } from "@/icerik/yukle";
import UlkeSayfasi, { type Komsu } from "@/oynatici/UlkeSayfasi";

export const dynamicParams = false;

export function generateStaticParams() {
  return hazirUlkeler().map((ulke) => ({ ulke }));
}

type Props = { params: Promise<{ ulke: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ulke: slug } = await params;
  const u = ulkeYukle(slug);
  const og = fs.existsSync(path.join(process.cwd(), "public", "img", slug, "og.jpg")) ? `/img/${slug}/og.jpg` : undefined;
  return {
    title: u.ad,
    description: `${u.ad}: başkent ${u.baskent}. Sesli ve hareketli kitapçık sayfası.`,
    openGraph: og ? { images: [{ url: og, width: 1200, height: 630 }] } : undefined,
  };
}

function kelimeleriOku(slug: string, adimIdler: string[]): Record<string, Kelime[]> {
  const sonuc: Record<string, Kelime[]> = {};
  for (const id of adimIdler) {
    const dosya = path.join(process.cwd(), "public", "ses", slug, `${id}.json`);
    sonuc[id] = fs.existsSync(dosya) ? (JSON.parse(fs.readFileSync(dosya, "utf8")) as Kelime[]) : [];
  }
  return sonuc;
}

export default async function Sayfa({ params }: Props) {
  const { ulke: slug } = await params;
  const u = ulkeYukle(slug);
  const k = kitap();
  const tumu = k.sayfalar;
  const i = tumu.findIndex((s) => s.slug === slug);
  const bu = tumu[i];

  // Sayfa çevirme kitapçık sırasıyla; hazırlanmamış sayfalar atlanır
  const komsu = (yon: 1 | -1): Komsu => {
    for (let j = i + yon; j >= 0 && j < tumu.length; j += yon) {
      const p = tumu[j];
      if (p.hazir) return { slug: p.slug, ad: p.ad, bayrak: p.bayrak, sira: j + 1 };
    }
    return null;
  };

  return (
    <UlkeSayfasi
      ulke={u}
      kelimeler={kelimeleriOku(slug, u.adimlar.map((a) => a.id))}
      sira={i + 1}
      toplam={tumu.length}
      bayrak={bu.bayrak}
      konum={konumKarti(bu.iso, bu.konum, k.baslangic)}
      onceki={komsu(-1)}
      sonraki={komsu(1)}
      digerleri={tumu.filter((s) => s.hazir).map(({ slug, ad }) => ({ slug, ad }))}
      hazirlayan={k.hazirlayan}
      baglantiHazir={!!u.baglanti && tumu.some((s) => s.slug === u.baglanti!.slug && s.hazir)}
    />
  );
}
