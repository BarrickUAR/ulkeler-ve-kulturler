import { dunyaYollari, HARITA_G, HARITA_Y } from "@/icerik/dunya";

export const dynamic = "force-static";

/** Çizgi film dünya haritası (taban katman). Vurgular sayfadaki üst SVG katmanında çizilir. */
export function GET() {
  const yollar = dunyaYollari()
    .map((u) => `<path d="${u.d}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HARITA_G} ${HARITA_Y}"><g fill="#f7f0d8" stroke="#17295c" stroke-width="0.8" stroke-linejoin="round">${yollar}</g></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" } });
}
