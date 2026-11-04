import type { Kutu } from "@/icerik/sema";

export type KameraHedef = { x: number; y: number; olcek: number };

export const TUM: KameraHedef = { x: 0, y: 0, olcek: 1 };

/**
 * Sahne kutusu posterle aynı orana sahip. Kamera iç katmana
 * `translate(x, y) scale(olcek)` uygular (transform-origin: 0 0), x/y sahne boyutunun oranı.
 * Kutu merkeze gelir, kenarlarda boşluk kalmayacak şekilde sınırlanır.
 */
export function hedefHesapla(kutu: Kutu | null, enFazla = 2.6): KameraHedef {
  if (!kutu) return TUM;
  const pay = 1.18;
  const olcek = Math.min(enFazla, Math.max(1, Math.min(1 / (kutu.w * pay), 1 / (kutu.h * pay))));
  const cx = kutu.x + kutu.w / 2;
  const cy = kutu.y + kutu.h / 2;
  const sinirla = (v: number) => Math.min(0, Math.max(1 - olcek, v));
  return { x: sinirla(0.5 - cx * olcek), y: sinirla(0.5 - cy * olcek), olcek };
}
