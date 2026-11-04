"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Kelime, Ulke } from "@/icerik/sema";
import { Ikon, Yildiz, YuvarlakSoru } from "./isaretler";
import { useTur } from "./useTur";
import s from "./ulke.module.css";

type Komsu = { slug: string; ad: string } | null;

type Props = {
  ulke: Ulke;
  kelimeler: Record<string, Kelime[]>;
  onceki: Komsu;
  sonraki: Komsu;
  digerleri: { slug: string; ad: string }[];
  hazirlayan: string;
  baglantiHazir: boolean;
};

const pct = (v: number) => `${v * 100}%`;

export default function UlkeSayfasi({ ulke, kelimeler, onceki, sonraki, digerleri, hazirlayan, baglantiHazir }: Props) {
  const tur = useTur(ulke, kelimeler);
  const { durum, aktif, aktifAdim, kelimeIndeks, serbestMetin } = tur;
  const [ipucu, setIpucu] = useState(true);
  const sunumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (durum !== "hazir") setIpucu(false);
  }, [durum]);

  // Klavye: boşluk oynat/duraklat, oklar adım, F tam ekran (tahtada sunum için)
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement;
      if (hedef.closest("input, select, textarea")) return;
      if (e.key === " " && !hedef.closest("button, a")) {
        e.preventDefault();
        tur.oynatDuraklat();
      } else if (e.key === "ArrowRight") tur.git(1);
      else if (e.key === "ArrowLeft") tur.git(-1);
      else if (e.key.toLowerCase() === "f") tamEkran();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  });

  const tamEkran = () => {
    const el = sunumRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  };

  const anaEtiket =
    durum === "oynuyor" ? "Duraklat" : durum === "duraklatildi" ? "Devam et" : durum === "bitti" ? "Baştan dinle" : "Dinle";
  const anaIkon = durum === "oynuyor" ? "duraklat" : durum === "bitti" ? "bastan" : "oynat";

  const efektli = ulke.ogeler.filter((o) => o.efekt);
  const bolum = aktifAdim?.bolum;

  return (
    <div className={s.kok} style={{ "--country": ulke.renk.zemin, "--marker": ulke.renk.marker, "--oran": ulke.poster.oran } as React.CSSProperties}>
      <header className={s.ust}>
        <Link href="/" className={s.geriLink}>
          <span aria-hidden="true">←</span> Kitapçık
        </Link>
        <label className={s.ulkeSec}>
          <span className="gorunmez">Ülke seç</span>
          <select
            id="ulke-sec"
            value={ulke.slug}
            onChange={(e) => {
              location.href = `/${e.target.value}`;
            }}
          >
            {digerleri.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.ad}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className={s.sayfa}>
        <div className={s.sol} ref={sunumRef}>
          <h1 className={s.baslik}>{ulke.baslik}</h1>

          <div className={s.sahne} aria-label={`${ulke.ad} haritası`}>
            <div className={s.kamera} ref={tur.kameraRef}>
              <picture>
                <img
                  className={s.poster}
                  src={`/img/${ulke.slug}/poster-1600.webp`}
                  alt={`${ulke.ad} haritası: ${ulke.ogeler.map((o) => o.etiket).join(", ")}`}
                  draggable={false}
                />
              </picture>
              {efektli.map((o) => {
                const k = o.kesik ?? o.kutu;
                return (
                  <div
                    key={o.id}
                    ref={tur.katmanKaydet(o.id)}
                    className={s.katman}
                    style={{ left: pct(k.x), top: pct(k.y), width: pct(k.w), height: pct(k.h) }}
                    aria-hidden="true"
                  >
                    <img data-alt src={`/img/${ulke.slug}/oge-${o.id}-alt.webp`} alt="" draggable={false} />
                    <img data-kesik src={`/img/${ulke.slug}/oge-${o.id}.webp`} alt="" draggable={false} />
                  </div>
                );
              })}
              <div className={s.karakterAlani} ref={tur.karakterAlaniRef} aria-hidden="true" />
              {ulke.ogeler.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={s.nokta}
                  data-secili={aktifAdim?.odak === o.id || undefined}
                  style={{ left: pct(o.kutu.x), top: pct(o.kutu.y), width: pct(o.kutu.w), height: pct(o.kutu.h) }}
                  onClick={() => tur.ogeSec(o.id)}
                  aria-label={o.etiket}
                />
              ))}
            </div>
          </div>

          <div className={s.altyazi} aria-live="polite">
            {serbestMetin ? (
              <p className={s.altyaziMetin}>{serbestMetin}</p>
            ) : aktifAdim ? (
              <Altyazi metin={aktifAdim.metin} sozluSayi={(kelimeler[aktifAdim.id] ?? []).length} indeks={kelimeIndeks} />
            ) : (
              <p className={s.altyaziBos}>{ipucu ? "Dinle'ye bas ya da resimdeki bir şeye dokun." : ""}</p>
            )}
          </div>

          <div className={s.kontrol}>
            <button type="button" className={s.ana} onClick={tur.oynatDuraklat}>
              <Ikon ad={anaIkon} />
              {anaEtiket}
            </button>
            <div className={s.adimlar}>
              <button type="button" className={s.ikonBtn} onClick={() => tur.git(-1)} aria-label="Önceki" disabled={aktif <= 0}>
                <Ikon ad="geri" />
              </button>
              <span className={s.sayac}>
                {Math.max(aktif + 1, 0)} / {ulke.adimlar.length}
              </span>
              <button
                type="button"
                className={s.ikonBtn}
                onClick={() => tur.git(1)}
                aria-label="Sonraki"
                disabled={aktif >= ulke.adimlar.length - 1}
              >
                <Ikon ad="ileri" />
              </button>
            </div>
            <button
              type="button"
              className={`${s.ikonBtn} ${s.sesBtn}`}
              onClick={tur.sessizDegistir}
              aria-label={tur.sessiz ? "Sesi aç" : "Sesi kapat"}
              aria-pressed={tur.sessiz}
            >
              <Ikon ad={tur.sessiz ? "sessiz" : "ses"} />
            </button>
            <button type="button" className={`${s.ikonBtn} ${s.tamEkranBtn}`} onClick={tamEkran} aria-label="Tam ekran">
              <Ikon ad="tamekran" />
            </button>
          </div>
        </div>

        <aside className={s.sag}>
          <dl className={s.kimlik} data-aktif={bolum === "kimlik" || undefined}>
            <div>
              <dt>Başkent</dt>
              <dd>{ulke.baskent}</dd>
            </div>
            <div>
              <dt>{ulke.dilEtiket}</dt>
              <dd>{ulke.dil}</dd>
            </div>
          </dl>

          <p className={s.metin} data-aktif={bolum === "metin" || undefined}>
            <Yildiz className={s.yildiz} />
            {ulke.metin}
          </p>

          <div className={s.bilgi} data-aktif={bolum === "bilgi" || undefined}>
            <YuvarlakSoru className={s.soru} />
            <p>
              <span className="gorunmez">Biliyor muydun? </span>
              {ulke.biliyorMuydun}
            </p>
          </div>

          {ulke.baglanti && baglantiHazir && (
            <Link className={s.baglanti} href={`/${ulke.baglanti.slug}`}>
              {ulke.baglanti.metin} <span aria-hidden="true">→</span>
            </Link>
          )}
        </aside>
      </main>

      <footer className={s.alt}>
        <nav className={s.sayfaCevir} aria-label="Sayfalar">
          {onceki ? (
            <Link href={`/${onceki.slug}`}>
              <span aria-hidden="true">←</span> {onceki.ad}
            </Link>
          ) : (
            <span />
          )}
          {sonraki ? (
            <Link href={`/${sonraki.slug}`}>
              {sonraki.ad} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
        {hazirlayan && <p className={s.imza}>Hazırlayan: {hazirlayan}</p>}
      </footer>
    </div>
  );
}

/** Okunan cümle; seslendirmedeki kelime zamanına göre kelime kelime vurgulanır. */
function Altyazi({ metin, sozluSayi, indeks }: { metin: string; sozluSayi: number; indeks: number }) {
  const kelimeler = metin.split(/\s+/);
  // Okunuş metni farklı uzunluktaysa oransal eşle
  const aktif =
    indeks < 0 || sozluSayi === 0
      ? -1
      : indeks >= sozluSayi
        ? kelimeler.length
        : sozluSayi === kelimeler.length
          ? indeks
          : Math.min(kelimeler.length - 1, Math.floor(((indeks + 0.5) * kelimeler.length) / sozluSayi));
  return (
    <p className={s.altyaziMetin}>
      {kelimeler.map((k, i) => (
        <span key={i} data-durum={i < aktif ? "gecti" : i === aktif ? "simdi" : undefined}>
          {k}{" "}
        </span>
      ))}
    </p>
  );
}
