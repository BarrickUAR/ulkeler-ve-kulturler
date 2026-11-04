"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gezilenler, pasaportuDinle } from "@/icerik/pasaport";
import { Damga } from "./Damga";
import s from "./duraklar.module.css";

export type DurakKarti = {
  slug: string;
  ad: string;
  bayrak: string;
  baskent: string;
  hazir: boolean;
  posterVar: boolean;
};

function useGezilen(): string[] {
  const [liste, setListe] = useState<string[]>([]);
  useEffect(() => {
    const guncelle = () => setListe(gezilenler());
    guncelle();
    return pasaportuDinle(guncelle);
  }, []);
  return liste;
}

/** Pasaport şeridi: kaç ülke gezildi, hangi bayraklar toplandı. */
export function Pasaport({ duraklar }: { duraklar: DurakKarti[] }) {
  const gezilen = useGezilen();
  const sayi = duraklar.filter((d) => gezilen.includes(d.slug)).length;
  const bitti = sayi === duraklar.length;
  return (
    <section className={s.pasaport} aria-label="Pasaportun">
      <div className={s.pasaportBaslik}>
        <span className={s.pasaportEtiket}>PASAPORT</span>
        <p className={s.pasaportSayi}>
          <strong>{sayi}</strong> / {duraklar.length} ülke gezildi
        </p>
        <p className={s.pasaportNot}>
          {bitti ? "Dünya turunu tamamladın, tebrikler!" : sayi === 0 ? "Bir ülkenin turunu sonuna kadar dinle, damgası buraya basılsın." : "Harika gidiyorsun, sıradaki durağa geç!"}
        </p>
      </div>
      <ol className={s.bayraklar}>
        {duraklar.map((d) => {
          const var_ = gezilen.includes(d.slug);
          return (
            <li key={d.slug} data-gezildi={var_ || undefined} title={var_ ? `${d.ad}: gezildi` : d.ad}>
              <img src={`/bayrak/${d.bayrak}.svg`} alt={d.ad} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Kartpostal gibi ülke kartları; gezilenlerin üstünde damga. */
export function DurakKartlari({ duraklar }: { duraklar: DurakKarti[] }) {
  const gezilen = useGezilen();
  return (
    <ol className={s.izgara}>
      {duraklar.map((d, i) => {
        const ic = (
          <>
            <span className={s.sira} aria-hidden="true">
              {i + 1}
            </span>
            <div className={s.resim}>
              {d.posterVar && <img src={`/img/${d.slug}/poster-1600.webp`} alt="" loading="lazy" />}
              {!d.hazir && <span className={s.bant}>Hazırlanıyor</span>}
              {gezilen.includes(d.slug) && <Damga className={s.damga} ulke={d.ad} />}
            </div>
            <div className={s.alt}>
              <img className={s.bayrak} src={`/bayrak/${d.bayrak}.svg`} alt="" />
              <div className={s.yazi}>
                <span className={s.ad}>{d.ad}</span>
                <span className={s.baskent}>Başkent: {d.baskent}</span>
              </div>
              {d.hazir && (
                <span className={s.ok} aria-hidden="true">
                  →
                </span>
              )}
            </div>
          </>
        );
        return (
          <li key={d.slug}>
            {d.hazir ? (
              <Link href={`/${d.slug}`} className={s.kart} aria-label={`${i + 1}. durak: ${d.ad}`}>
                {ic}
              </Link>
            ) : (
              <div className={s.kart} data-bekliyor aria-label={`${i + 1}. durak: ${d.ad}, hazırlanıyor`}>
                {ic}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
