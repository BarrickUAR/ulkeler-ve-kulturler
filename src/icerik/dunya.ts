import "server-only";
import { geoDistance, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import dunya110 from "world-atlas/countries-110m.json";

/** Derleme anında hesaplanan, sayfaya düz SVG olarak giden dünya haritası. */
export const HARITA_G = 1000;
export const HARITA_Y = 500;

type UlkeOzellik = { name: string };

const topo = dunya110 as unknown as Topology<{ countries: GeometryCollection<UlkeOzellik> }>;
const ulkeler = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, UlkeOzellik>).features.filter(
  (f) => f.id !== "010", // Antarktika haritayı aşağı uzatıyor
);

const projeksiyon = geoNaturalEarth1().fitExtent(
  [
    [6, 6],
    [HARITA_G - 6, HARITA_Y - 6],
  ],
  { type: "FeatureCollection", features: ulkeler } as FeatureCollection,
);
const yol = geoPath(projeksiyon);

export type HaritaUlke = { id: string; d: string };

let onbellek: HaritaUlke[] | null = null;
export function dunyaYollari(): HaritaUlke[] {
  onbellek ??= ulkeler.map((f: Feature<Geometry, UlkeOzellik>) => ({ id: String(f.id), d: yol(f) ?? "" }));
  return onbellek;
}

export function nokta(konum: [number, number]): [number, number] {
  const p = projeksiyon(konum);
  return p ? [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] : [0, 0];
}

/** İki nokta arasında yukarı kavisli uçuş yolu (çizgi film rotası). */
export function ucusYolu(noktalar: [number, number][]): string {
  if (noktalar.length < 2) return "";
  let d = `M${noktalar[0][0]},${noktalar[0][1]}`;
  for (let i = 1; i < noktalar.length; i++) {
    const [x0, y0] = noktalar[i - 1];
    const [x1, y1] = noktalar[i];
    const uzak = Math.hypot(x1 - x0, y1 - y0);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2 - Math.min(140, uzak * 0.28);
    d += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${x1},${y1}`;
  }
  return d;
}

/** Kuş uçuşu uzaklık (km), en yakın yüze yuvarlanmış. */
export function uzaklikKm(a: [number, number], b: [number, number]): number {
  return Math.round((geoDistance(a, b) * 6371) / 100) * 100;
}

/** Ülke sayfasındaki "Dünyada nerede?" kartı için vurgu katmanı verisi. */
export function konumKarti(iso: string, konum: [number, number], tr: { iso: string; konum: [number, number] }) {
  const yollar = new Map(dunyaYollari().map((u) => [u.id, u.d]));
  const nk = nokta(konum);
  const nt = nokta(tr.konum);
  return {
    ulkeYolu: yollar.get(iso) ?? "",
    trYolu: yollar.get(tr.iso) ?? "",
    nokta: nk,
    trNokta: nt,
    rota: ucusYolu([nt, nk]),
    km: uzaklikKm(tr.konum, konum),
  };
}
export type KonumKarti = ReturnType<typeof konumKarti>;
