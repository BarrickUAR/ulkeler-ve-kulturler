import { dunyaYollari, HARITA_G, HARITA_Y, nokta, ucusYolu } from "@/icerik/dunya";
import type { Kitap } from "@/icerik/yukle";
import s from "./dunya.module.css";

/** Ana sayfa: Türkiye'den kalkıp kitapçıktaki ülkeleri sırayla gezen uçak rotası. */
export default function DunyaRotasi({ kitap }: { kitap: Kitap }) {
  const yollar = new Map(dunyaYollari().map((u) => [u.id, u.d]));
  const tr = nokta(kitap.baslangic.konum);
  // Kenardaki ülkelerin (Fiji, 178°D) rozeti haritadan taşmasın: telefonda büyüyen rozete yer bırak
  const KENAR = 26;
  const duraklar = kitap.sayfalar.map((p) => {
    const [x, y] = nokta(p.konum);
    return { ...p, xy: [Math.min(Math.max(x, KENAR), HARITA_G - KENAR), Math.min(Math.max(y, KENAR), HARITA_Y - KENAR)] as [number, number] };
  });
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
              <UstenUcak />
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

/**
 * Uçuş ekranındaki çizgi film uçağının üstten görünüşü (burnu +x yönünde).
 * Simetrik olduğu için rota sola dönünce ters görünmez. Gölge, dönmeyen .ucak katmanında (CSS).
 */
function UstenUcak() {
  const kanat = "M3,-3.5 L-5,-21 L0.5,-22 L13,-3.5 Z";
  const kuyruk = "M-14,-2.5 L-20,-10.5 L-16.5,-11 L-9,-2.5 Z";
  const govde = "M-20,0 C-20,-3 -15,-4.6 -9,-4.6 L10,-4.6 C17,-4.6 22,-2.4 23.5,0 C22,2.4 17,4.6 10,4.6 L-9,4.6 C-15,4.6 -20,3 -20,0 Z";
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g stroke="#17295c" strokeWidth="1.6">
        <path d={kanat} fill="#ffcd2e" />
        <path d={kanat} transform="scale(1,-1)" fill="#ffcd2e" />
        {/* motorlar */}
        <rect x="-1" y="-15" width="8" height="4" rx="2" fill="#c9d7ef" />
        <rect x="-1" y="11" width="8" height="4" rx="2" fill="#c9d7ef" />
        <path d={kuyruk} fill="#e2403b" />
        <path d={kuyruk} transform="scale(1,-1)" fill="#e2403b" />
        <path d={govde} fill="#ffffff" />
        {/* kokpit camı */}
        <path d="M14,-2.6 C17.5,-2.2 20,-1.2 21,0 C20,1.2 17.5,2.2 14,2.6 C13,1 13,-1 14,-2.6 Z" fill="#86c9f0" strokeWidth="1.2" />
      </g>
      {/* gövde şeridi ve pencereler */}
      <path d="M-15,0 H9" stroke="#e2403b" strokeWidth="1.6" />
      <g fill="#86c9f0">
        <circle cx="-8" cy="-2.4" r="0.9" />
        <circle cx="-4" cy="-2.4" r="0.9" />
        <circle cx="0" cy="-2.4" r="0.9" />
        <circle cx="4" cy="-2.4" r="0.9" />
        <circle cx="-8" cy="2.4" r="0.9" />
        <circle cx="-4" cy="2.4" r="0.9" />
        <circle cx="0" cy="2.4" r="0.9" />
        <circle cx="4" cy="2.4" r="0.9" />
      </g>
    </g>
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
