import { z } from "zod";

/** Poster üzerinde oransal kutu (0-1). */
export const Kutu = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().gt(0).max(1),
  h: z.number().gt(0).max(1),
});
export type Kutu = z.infer<typeof Kutu>;

export const EfektTip = z.enum(["zipla", "salla", "don", "belir", "titre", "buhar", "notalar", "fener"]);
export type EfektTip = z.infer<typeof EfektTip>;

export const Oge = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  etiket: z.string(),
  kutu: Kutu,
  /** Nesnenin kendisinin kesildiği bölge (kutudan küçük olabilir; yoksa kutu kullanılır). */
  kesik: Kutu.optional(),
  efekt: z
    .object({
      tip: EfektTip,
      /** salla/don için dönme noktası, kesiğe göre 0-1 (varsayılan alt-orta / merkez). */
      merkez: z.tuple([z.number(), z.number()]).optional(),
      /** Efektin kaç kez tekrar edeceği. */
      tekrar: z.number().int().min(1).max(6).optional(),
    })
    .optional(),
});
export type Oge = z.infer<typeof Oge>;

/** Ses ortasında kamera / efekt geçişi: konuşulan metindeki kelimeye bağlı. */
export const Ara = z.object({
  kelime: z.string(),
  odak: z.string().optional(),
  efektler: z.array(z.string()).optional(),
});

export const Adim = z.object({
  id: z.string().regex(/^[0-9]{2}-[a-z0-9-]+$/),
  /** "tum" = tüm poster, aksi halde nesne kimliği. */
  odak: z.string(),
  metin: z.string(),
  /** TTS'in okuyacağı hali (yabancı isimler için); yoksa metin okunur. */
  okunus: z.string().nullable().optional(),
  efektler: z.array(z.string()).default([]),
  ara: z.array(Ara).default([]),
  sahne: z.enum(["futbolcu-atis", "leonardo-boyar"]).optional(),
  /** Okuyacak rehber (yoksa tools/tts.py kuralı seçer). */
  ses: z.enum(["kadin", "erkek"]).optional(),
  /** Yan sütunda vurgulanacak blok. */
  bolum: z.enum(["kimlik", "metin", "bilgi"]).optional(),
});
export type Adim = z.infer<typeof Adim>;

export const Ulke = z.object({
  slug: z.string().regex(/^[a-z-]+$/),
  ad: z.string(),
  /** Defterdeki başlık (büyük harf, markör yazısı). */
  baslik: z.string(),
  sira: z.number().int(),
  renk: z.object({ zemin: z.string(), marker: z.string() }),
  baskent: z.string(),
  dilEtiket: z.enum(["Dil", "Diller"]).default("Dil"),
  dil: z.string(),
  metin: z.string(),
  biliyorMuydun: z.string(),
  poster: z.object({ oran: z.number() }),
  ogeler: z.array(Oge),
  adimlar: z.array(Adim).min(1),
  baglanti: z.object({ metin: z.string(), slug: z.string() }).optional(),
});
export type Ulke = z.infer<typeof Ulke>;

export type Kelime = { w: string; t: number; d: number };

/** Adımı okuyan rehber (altyazıdaki rozet). */
export type Rehber = { tur: "kadin" | "erkek"; ad: string };
