"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Damga } from "@/bilesenler/Damga";
import type { KonumKarti } from "@/icerik/dunya";
import { damgala } from "@/icerik/pasaport";
import type { Kelime, Oge, Ulke } from "@/icerik/sema";
import { Ikon, Yildiz, YuvarlakSoru } from "./isaretler";
import { useTur } from "./useTur";
import s from "./ulke.module.css";

export type Komsu = { slug: string; ad: string; bayrak: string; sira: number } | null;

type Props = {
  ulke: Ulke;
  kelimeler: Record<string, Kelime[]>;
  sira: number;
  toplam: number;
  bayrak: string;
  konum: KonumKarti;
  onceki: Komsu;
  sonraki: Komsu;
  digerleri: { slug: string; ad: string }[];
  hazirlayan: string;
  baglantiHazir: boolean;
};

const pct = (v: number) => `${v * 100}%`;
const sayi = new Intl.NumberFormat("tr-TR");

export default function UlkeSayfasi(p: Props) {
  const { ulke, kelimeler } = p;
  const tur = useTur(ulke, kelimeler);
  const { durum, aktif, aktifAdim, kelimeIndeks, serbestMetin, gorulenler } = tur;
  const [ipucu, setIpucu] = useState(true);
  const [damga, setDamga] = useState(false);
  /** Sunum modu: tahtada/telefonda harita ekranı kaplar (tam ekran API'si olmayan iPhone'da da çalışır). */
  const [sunum, setSunum] = useState(false);
  const sunumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (durum !== "hazir") setIpucu(false);
    if (durum === "bitti") {
      damgala(ulke.slug);
      setDamga(true);
    }
    if (durum === "oynuyor") setDamga(false);
  }, [durum, ulke.slug]);

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
      else if (e.key === "Escape" && sunum) sunumKapat();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  });

  const sunumKapat = () => {
    setSunum(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  };
  const tamEkran = () => {
    if (sunum) return sunumKapat();
    setSunum(true);
    // Gerçek tam ekran destekleniyorsa sayfanın tamamını aç (sunum katmanı içinde kalır)
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Tarayıcının kendi tam ekranından (Esc) çıkılınca sunum modunu da kapat
  useEffect(() => {
    const degisti = () => {
      if (!document.fullscreenElement) setSunum(false);
    };
    document.addEventListener("fullscreenchange", degisti);
    return () => document.removeEventListener("fullscreenchange", degisti);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = sunum ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [sunum]);

  const anaEtiket =
    durum === "oynuyor" ? "Duraklat" : durum === "duraklatildi" ? "Devam et" : durum === "bitti" ? "Baştan dinle" : "Dinle";
  const anaIkon = durum === "oynuyor" ? "duraklat" : durum === "bitti" ? "bastan" : "oynat";

  const efektli = ulke.ogeler.filter((o) => o.efekt);
  const bolum = aktifAdim?.bolum;
  const oran = ulke.poster.oran;

  return (
    <div className={s.kok} style={{ "--country": ulke.renk.zemin, "--marker": ulke.renk.marker, "--oran": oran } as React.CSSProperties}>
      <header className={s.ust}>
        <div className={s.ustIc}>
          <Link href="/" className={s.logo} aria-label="Ana sayfa: Ülkeler ve Kültürler">
            <span aria-hidden="true">←</span> <span className={s.logoUzun}>Ülkeler ve Kültürler</span>
            <span className={s.logoKisa}>Ana sayfa</span>
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
              {p.digerleri.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.ad}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className={s.sayfa}>
        <div className={s.sol} ref={sunumRef} data-sunum={sunum || undefined}>
          <div className={s.baslikSatir}>
            <img className={s.bayrak} src={`/bayrak/${p.bayrak}.svg`} alt={`${ulke.ad} bayrağı`} />
            <h1 className={s.baslik}>{ulke.baslik}</h1>
            <span className={s.durakRozet}>
              {p.sira}. durak <span>/ {p.toplam}</span>
            </span>
          </div>

          <div className={s.sahneCerceve}>
            <div className={s.sahne} aria-label={`${ulke.ad} haritası`}>
              <div className={s.kamera} ref={tur.kameraRef}>
                <img
                  className={s.poster}
                  src={`/img/${ulke.slug}/poster-1600.webp`}
                  alt={`${ulke.ad} haritası: ${ulke.ogeler.map((o) => o.etiket).join(", ")}`}
                  draggable={false}
                />
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
                    tabIndex={-1}
                    className={s.nokta}
                    style={{ left: pct(o.kutu.x), top: pct(o.kutu.y), width: pct(o.kutu.w), height: pct(o.kutu.h) }}
                    onClick={() => tur.ogeSec(o.id)}
                    aria-label={o.etiket}
                  />
                ))}
              </div>

              {damga && (
                <div className={s.damgaKatman} role="status">
                  <Damga className={s.damgaResim} ulke={ulke.ad} />
                  <p className={s.damgaYazi}>Pasaportuna damga basıldı!</p>
                  <div className={s.damgaEylem}>
                    {p.sonraki && (
                      <Link href={`/${p.sonraki.slug}`} className={s.damgaSonraki}>
                        Sıradaki durak: {p.sonraki.ad} <span aria-hidden="true">→</span>
                      </Link>
                    )}
                    <button type="button" className={s.damgaKapat} onClick={() => setDamga(false)}>
                      Haritaya dön
                    </button>
                  </div>
                </div>
              )}
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
            <button
              type="button"
              className={`${s.ikonBtn} ${s.tamEkranBtn}`}
              onClick={tamEkran}
              aria-label={sunum ? "Tam ekrandan çık" : "Tam ekran"}
              aria-pressed={sunum}
            >
              <Ikon ad={sunum ? "kapat" : "tamekran"} />
            </button>
          </div>
          <div className={s.ilerleme} aria-hidden="true">
            <span style={{ width: `${((aktif + 1) / ulke.adimlar.length) * 100}%` }} />
          </div>

          <section className={s.nesneler} aria-labelledby="nesneler-baslik">
            <div className={s.bolumUst}>
              <h2 id="nesneler-baslik">Haritada neler var?</h2>
              <p>
                {gorulenler.size} / {ulke.ogeler.length} keşfedildi
              </p>
            </div>
            <ul className={s.nesneListe}>
              {ulke.ogeler.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className={s.nesne}
                    data-aktif={aktifAdim?.odak === o.id || undefined}
                    data-goruldu={gorulenler.has(o.id) || undefined}
                    onClick={() => tur.ogeSec(o.id)}
                  >
                    <span className={s.kucukResim} style={kucukResim(ulke.slug, o, oran)} aria-hidden="true" />
                    <span className={s.nesneAd}>{o.etiket}</span>
                    {gorulenler.has(o.id) && (
                      <span className={s.tik} aria-label="keşfedildi">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={s.sag}>
          <div className={s.defter}>
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
          </div>

          <div className={s.not} data-aktif={bolum === "bilgi" || undefined}>
            <span className={s.notBant} aria-hidden="true" />
            <YuvarlakSoru className={s.soru} />
            <div>
              <p className={s.notBaslik}>Biliyor muydun?</p>
              <p className={s.notMetin}>{ulke.biliyorMuydun}</p>
            </div>
          </div>

          <section className={s.konum} aria-labelledby="konum-baslik">
            <h2 id="konum-baslik">Dünyada nerede?</h2>
            <MiniHarita konum={p.konum} />
            <p className={s.uzaklik}>
              Türkiye&apos;ye kuş uçuşu yaklaşık <strong>{sayi.format(p.konum.km)} km</strong>
            </p>
          </section>

          {ulke.baglanti && p.baglantiHazir && (
            <Link className={s.baglanti} href={`/${ulke.baglanti.slug}`}>
              {ulke.baglanti.metin} <span aria-hidden="true">→</span>
            </Link>
          )}
        </aside>
      </main>

      <footer className={s.alt}>
        <nav className={s.sayfaCevir} aria-label="Sayfalar">
          {p.onceki ? <SayfaKarti k={p.onceki} yon="onceki" /> : <span />}
          {p.sonraki ? <SayfaKarti k={p.sonraki} yon="sonraki" /> : <span />}
        </nav>
        {p.hazirlayan && <p className={s.imza}>Hazırlayan: {p.hazirlayan}</p>}
      </footer>
    </div>
  );
}

/** Nesnenin poster üzerindeki bölgesini kare küçük resimde gösterir (ayrı dosya gerekmez). */
function kucukResim(slug: string, o: Oge, oran: number): React.CSSProperties {
  const k = o.kesik ?? o.kutu;
  // Kare küçük resmi nesneyle doldur (cover): kısa kenar sığar, uzun kenar ortadan kırpılır
  const buyuk = 1 / Math.min(k.w, k.h / oran); // posterin küçük resme göre genişliği
  const buyukY = buyuk / oran;
  const cx = k.x + k.w / 2;
  const cy = k.y + k.h / 2;
  const konum = (c: number, b: number) => (b <= 1 ? 50 : Math.min(100, Math.max(0, ((c * b - 0.5) / (b - 1)) * 100)));
  return {
    backgroundImage: `url(/img/${slug}/poster-1600.webp)`,
    backgroundSize: `${buyuk * 100}% auto`,
    backgroundPosition: `${konum(cx, buyuk)}% ${konum(cy, buyukY)}%`,
  };
}

function MiniHarita({ konum }: { konum: KonumKarti }) {
  return (
    <div className={s.mini}>
      <img src="/dunya.svg" alt="" />
      <svg viewBox="0 0 1000 500" role="img" aria-label="Dünya haritasında ülkenin yeri">
        <path d={konum.trYolu} fill="#e2403b" stroke="#17295c" strokeWidth="1.2" />
        <path d={konum.ulkeYolu} fill="#ffcd2e" stroke="#17295c" strokeWidth="1.6" />
        <path d={konum.rota} fill="none" stroke="#17295c" strokeWidth="3" strokeDasharray="10 8" strokeLinecap="round" />
        <circle cx={konum.trNokta[0]} cy={konum.trNokta[1]} r="9" fill="#fff" stroke="#e2403b" strokeWidth="4" />
        <circle cx={konum.nokta[0]} cy={konum.nokta[1]} r="22" fill="none" stroke="#e2403b" strokeWidth="5" />
        <circle cx={konum.nokta[0]} cy={konum.nokta[1]} r="8" fill="#e2403b" />
      </svg>
    </div>
  );
}

function SayfaKarti({ k, yon }: { k: NonNullable<Komsu>; yon: "onceki" | "sonraki" }) {
  return (
    <Link href={`/${k.slug}`} className={s.sayfaKarti} data-yon={yon}>
      <img className={s.sayfaKartiResim} src={`/img/${k.slug}/poster-1600.webp`} alt="" loading="lazy" />
      <span className={s.sayfaKartiYazi}>
        <span className={s.sayfaKartiUst}>{yon === "onceki" ? "← Önceki durak" : "Sıradaki durak →"}</span>
        <span className={s.sayfaKartiAd}>
          <img src={`/bayrak/${k.bayrak}.svg`} alt="" /> {k.ad}
        </span>
      </span>
    </Link>
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
