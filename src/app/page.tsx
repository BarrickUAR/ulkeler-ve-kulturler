import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { kitap } from "@/icerik/yukle";
import s from "./kitapcik.module.css";

export default function Kitapcik() {
  const k = kitap();
  const kapakVar = fs.existsSync(path.join(process.cwd(), "public", "img", "kapak", "kapak-1600.webp"));
  return (
    <div className={s.kok}>
      <header className={s.kapak}>
        {kapakVar ? (
          <img className={s.kapakResim} src="/img/kapak/kapak-1600.webp" alt="Kitapçığın kapağı: Ülkeler ve Kültürler" />
        ) : (
          <h1 className={s.yaziBaslik}>{k.baslik}</h1>
        )}
        {kapakVar && <h1 className="gorunmez">{k.baslik}</h1>}
        <p className={s.giris}>Bir ülkeye dokun, haritasını gez, anlatımını dinle.</p>
      </header>

      <main>
        <ol className={s.izgara}>
          {k.sayfalar.map((p) => (
            <li key={p.slug}>
              {p.hazir ? (
                <Link href={`/${p.slug}`} className={s.kart}>
                  <img src={`/img/${p.slug}/poster-1600.webp`} alt="" loading="lazy" />
                  <span className={s.ad}>{p.ad}</span>
                </Link>
              ) : (
                <div className={s.kart} data-bekliyor>
                  {fs.existsSync(path.join(process.cwd(), "public", "img", p.slug, "poster-1600.webp")) && (
                    <img src={`/img/${p.slug}/poster-1600.webp`} alt="" loading="lazy" />
                  )}
                  <span className={s.ad}>
                    {p.ad} <span className={s.yakinda}>hazırlanıyor</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </main>

      {k.hazirlayan && <footer className={s.alt}>Hazırlayan: {k.hazirlayan}</footer>}
    </div>
  );
}
