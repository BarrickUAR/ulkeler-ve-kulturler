import Link from "next/link";
import DunyaRotasi from "@/bilesenler/DunyaRotasi";
import { DurakKartlari, Pasaport, type DurakKarti } from "@/bilesenler/Duraklar";
import { Bulut } from "@/bilesenler/Bulut";
import { kitap } from "@/icerik/yukle";
import s from "./kitapcik.module.css";

export default function Kitapcik() {
  const k = kitap();
  const ilk = k.sayfalar.find((p) => p.hazir);
  const duraklar: DurakKarti[] = k.sayfalar.map(({ slug, ad, bayrak, baskent, hazir, posterVar }) => ({
    slug,
    ad,
    bayrak,
    baskent,
    hazir,
    posterVar,
  }));

  return (
    <div className={s.kok}>
      {/* ——— Kapak ——— */}
      <header className={s.kapak}>
        <Bulut className={`${s.bulut} ${s.b1}`} />
        <Bulut className={`${s.bulut} ${s.b2}`} />
        <Bulut className={`${s.bulut} ${s.b3}`} />
        <Bulut className={`${s.bulut} ${s.b4}`} />

        <div className={s.kapakIc}>
          <div className={s.kapakYazi}>
            <p className={s.ust}>
              <span>{k.sayfalar.length} ülke</span>
              <span>1 dünya turu</span>
            </p>
            <h1 className={s.baslik}>
              <span>Ülkeler</span> <span className={s.ve}>ve</span> <span>Kültürler</span>
            </h1>
            <p className={s.giris}>
              Haritalara dokun, anlatımı dinle, resimlerin canlandığını izle. Her ülkenin turunu bitirince pasaportuna bir damga
              basılır!
            </p>
            <div className={s.eylemler}>
              {ilk && (
                <Link href={`/${ilk.slug}`} className={s.basla}>
                  Turu başlat
                  <span className={s.baslaUlke}>
                    <img src={`/bayrak/${ilk.bayrak}.svg`} alt="" /> {ilk.kisa}
                  </span>
                </Link>
              )}
              <a href="#duraklar" className={s.ikincil}>
                Tüm ülkeler ↓
              </a>
            </div>
          </div>

          <figure className={s.kitapcik}>
            <span className={`${s.bantKagit} ${s.bantSol}`} aria-hidden="true" />
            <span className={`${s.bantKagit} ${s.bantSag}`} aria-hidden="true" />
            <img src="/img/kapak/kapak-1600.webp" alt="Kitapçığın kapağı: dünyanın ünlü yapılarıyla çevrili Ülkeler ve Kültürler yazısı" />
            <figcaption className={s.kitapcikNot}>Kitapçığın kapağı</figcaption>
          </figure>
        </div>
      </header>

      {/* ——— Nasıl gezilir ——— */}
      <section className={s.bant1} aria-labelledby="nasil">
        <div className={s.ic}>
          <h2 id="nasil" className={s.bolumBaslik}>
            Nasıl gezilir?
          </h2>
          <ol className={s.adimlar}>
            <li>
              <span className={s.adimNo}>1</span>
              <div>
                <strong>QR kodu okut</strong>
                <p>Kitapçıktaki sayfanın köşesindeki kodu telefon kamerasıyla okut.</p>
              </div>
            </li>
            <li>
              <span className={s.adimNo}>2</span>
              <div>
                <strong>Dinle&apos;ye bas</strong>
                <p>Anlatıcı ülkeyi anlatırken kamera haritada geziyor, resimler hareket ediyor.</p>
              </div>
            </li>
            <li>
              <span className={s.adimNo}>3</span>
              <div>
                <strong>Resimlere dokun</strong>
                <p>Haritada merak ettiğin şeye dokun, sadece onu anlatsın.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ——— Rota ——— */}
      <section className={s.bant2} aria-labelledby="rota">
        <div className={s.ic}>
          <div className={s.bolumUst}>
            <h2 id="rota" className={s.bolumBaslik}>
              Dünya turu rotası
            </h2>
            <p className={s.bolumNot}>Türkiye&apos;den kalkıyoruz, kitapçıktaki sırayla bütün ülkeleri gezip geri dönüyoruz.</p>
          </div>
          <div className={s.haritaCerceve}>
            <DunyaRotasi kitap={k} />
          </div>
          <Pasaport duraklar={duraklar} />
        </div>
      </section>

      {/* ——— Duraklar ——— */}
      <section className={s.bant3} id="duraklar" aria-labelledby="duraklar-baslik">
        <div className={s.ic}>
          <h2 id="duraklar-baslik" className={s.bolumBaslik}>
            Duraklar
          </h2>
          <DurakKartlari duraklar={duraklar} />
        </div>
      </section>

      <footer className={s.alt}>
        <div className={s.ic}>{k.hazirlayan && <p>Hazırlayan: {k.hazirlayan}</p>}</div>
      </footer>
    </div>
  );
}
