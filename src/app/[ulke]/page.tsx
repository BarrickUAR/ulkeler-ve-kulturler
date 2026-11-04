import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { Kelime } from "@/icerik/sema";
import { hazirUlkeler, kitap, ulke as ulkeYukle } from "@/icerik/yukle";
import UlkeSayfasi from "@/oynatici/UlkeSayfasi";

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
  const hazir = k.sayfalar.filter((s) => s.hazir);
  const i = hazir.findIndex((s) => s.slug === slug);
  return (
    <UlkeSayfasi
      ulke={u}
      kelimeler={kelimeleriOku(slug, u.adimlar.map((a) => a.id))}
      onceki={i > 0 ? hazir[i - 1] : null}
      sonraki={i < hazir.length - 1 ? hazir[i + 1] : null}
      digerleri={hazir.map(({ slug, ad }) => ({ slug, ad }))}
      hazirlayan={k.hazirlayan}
      baglantiHazir={!!u.baglanti && hazir.some((s) => s.slug === u.baglanti!.slug)}
    />
  );
}
