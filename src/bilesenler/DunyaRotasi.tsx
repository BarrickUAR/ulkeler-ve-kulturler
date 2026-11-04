import { dunyaYollari, HARITA_G, HARITA_Y, nokta, ucusYolu } from "@/icerik/dunya";
import type { Kitap } from "@/icerik/yukle";
import s from "./dunya.module.css";

/** Ana sayfa: Türkiye'den kalkıp kitapçıktaki ülkeleri sırayla gezen uçak rotası. */
export default function DunyaRotasi({ kitap }: { kitap: Kitap }) {
  const yollar = new Map(dunyaYollari().map((u) => [u.id, u.d]));
  const tr = nokta(kitap.baslangic.konum);
  const duraklar = kitap.sayfalar.map((p) => ({ ...p, xy: nokta(p.konum) }));
  const rota = ucusYolu([tr, ...duraklar.map((d) => d.xy), tr]);

  return (
    <div className={s.harita}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.taban} src="/dunya.svg" alt="" />
      <svg className={s.ust} viewBox={`0 0 ${HARITA_G} ${HARITA_Y}`} role="img" aria-label="Dünya turu rotası">
        <title>Türkiye&apos;den başlayan dünya turu rotası</title>
        <defs>
          <clipPath id="bayrak-daire">
            <circle r="11" />
          </clipPath>
        </defs>

        {/* Kitapçıktaki ülkeler sarı, Türkiye kırmızı */}
        <g stroke="#17295c" strokeWidth="1.2" strokeLinejoin="round">
          {duraklar.map((d) => (
            <path key={d.slug} d={yollar.get(d.iso) ?? ""} fill={d.hazir ? "#ffcd2e" : "#ffe48a"} />
          ))}
          <path d={yollar.get(kitap.baslangic.iso) ?? ""} fill="#e2403b" />
        </g>

        <path id="ucus-rotasi" d={rota} fill="none" stroke="#17295c" strokeWidth="2.2" strokeDasharray="9 7" strokeLinecap="round" opacity="0.75" />

        {/* Uçak: rota boyunca döner (hareketi azalt açıksa CSS gizler) */}
        <g className={s.ucak}>
          <g>
            <g className={s.ucakGovde}>
            <path
              d="M-14,-2 L4,-2 L12,-9 L16,-9 L11,-2 L17,-2 Q21,0 17,2 L11,2 L16,9 L12,9 L4,2 L-14,2 L-18,-6 L-15,-6 L-10,-2 Z"
              fill="#ffffff"
              stroke="#17295c"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            </g>
            <animateMotion dur="48s" repeatCount="indefinite" rotate="auto">
              <mpath href="#ucus-rotasi" />
            </animateMotion>
          </g>
        </g>

        {/* Başlangıç */}
        <g transform={`translate(${tr[0]},${tr[1]})`}>
          <Rozet bayrak={kitap.baslangic.bayrak} />
          <Etiket metin="Buradan başlıyoruz!" dx={0} dy={34} renk="#e2403b" />
        </g>

        {duraklar.map((d, i) => {
          const icerik = (
            <g transform={`translate(${d.xy[0]},${d.xy[1]})`} className={s.durak}>
              <line x1="0" y1="0" x2={d.etiket[0] * 0.75} y2={d.etiket[1] * 0.75} stroke="#17295c" strokeWidth="1.6" className={s.cizgi} />
              <Rozet bayrak={d.bayrak} />
              <Etiket metin={`${i + 1}. ${d.kisa}`} dx={d.etiket[0]} dy={d.etiket[1]} renk={d.hazir ? "#17295c" : "#5d6a8c"} />
            </g>
          );
          return d.hazir ? (
            <a key={d.slug} href={`/${d.slug}`} aria-label={`${d.ad} sayfasına git`}>
              {icerik}
            </a>
          ) : (
            <g key={d.slug} opacity="0.85">
              {icerik}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Rozet({ bayrak }: { bayrak: string }) {
  return (
    <g className={s.rozet}>
      <circle r="13.5" fill="#ffffff" stroke="#17295c" strokeWidth="2.4" />
      <image href={`/bayrak/${bayrak}.svg`} x="-15" y="-11" width="30" height="22" preserveAspectRatio="xMidYMid slice" clipPath="url(#bayrak-daire)" />
      <circle r="11" fill="none" stroke="#17295c" strokeWidth="1" opacity="0.4" />
    </g>
  );
}

function Etiket({ metin, dx, dy, renk }: { metin: string; dx: number; dy: number; renk: string }) {
  const gen = metin.length * 8.6 + 18;
  return (
    <g transform={`translate(${dx},${dy})`} className={s.etiket}>
      <rect x={-gen / 2} y="-13" width={gen} height="26" rx="13" fill="#ffffff" stroke={renk} strokeWidth="2.2" />
      <text textAnchor="middle" y="5.5" fill={renk}>
        {metin}
      </text>
    </g>
  );
}
