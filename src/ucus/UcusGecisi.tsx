"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bulut } from "@/bilesenler/Bulut";
import { Ucak } from "./Ucak";
import { ucakSesi } from "./ucakSesi";
import s from "./ucus.module.css";

export type UcusHedefi = { slug: string; ad: string; gidis: string; bayrak: string };

/**
 * Uçuş perdesi:
 * - "geldi": QR ile doğrudan açılan ülke sayfası bulutların arasında uçan uçakla açılır ("ABD'ye hoş geldin!")
 * - "acilis": sayfa hazır olunca bulutlar büyüyüp dağılır, uçak çıkıp gider
 * - "ucus": site içinde başka sayfaya geçerken uçak sesi + bulutların arasından uçan uçak
 * - "bitis": varınca perde bulutlarla birlikte kaybolur
 */
type Mod = "yok" | "geldi" | "acilis" | "ucus" | "bitis";

const OLAY = "sayfa-hazir";
const EN_AZ_UCUS = 1700; // ms: uçuş en az bu kadar sürsün (ses + animasyon)
const EN_AZ_GELIS = 900;
const EN_FAZLA_BEKLEME = 4000;

/** Son "hazır" diyen sayfa: alt bileşenin efekti perdenin dinleyicisinden önce çalışabildiği için saklanır. */
let sonHazirYol: string | null = null;

/** Sayfa ilk görüntüsü hazır olunca (ör. poster yüklendi) çağrılır. */
export function sayfaHazir(): void {
  sonHazirYol = location.pathname;
  window.dispatchEvent(new CustomEvent(OLAY, { detail: location.pathname }));
}

let disaridanGit: ((yol: string) => void) | null = null;
/** Kod içinden (ör. ülke seçme kutusu) uçarak geçiş. */
export function ucarakGit(yol: string): void {
  if (disaridanGit) disaridanGit(yol);
  else location.href = yol;
}

const yolSlug = (yol: string) => yol.replace(/^\/+|\/+$/g, "").split(/[/?#]/)[0];
const hareketAz = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function UcusGecisi({ hedefler, children }: { hedefler: UcusHedefi[]; children: React.ReactNode }) {
  const router = useRouter();
  const yol = usePathname();
  const bul = (y: string) => hedefler.find((h) => h.slug === yolSlug(y)) ?? null;

  const [mod, setMod] = useState<Mod>(() => (bul(yol) ? "geldi" : "yok"));
  const [hedef, setHedef] = useState<UcusHedefi | null>(() => bul(yol));
  const baslangic = useRef(0);
  const beklenen = useRef<string | null>(yol);
  const hazirYol = useRef<string | null>(null);
  const modRef = useRef(mod);
  modRef.current = mod;

  const kapat = useCallback((sonraki: "acilis" | "bitis") => {
    setMod(sonraki);
    setTimeout(() => setMod((m) => (m === sonraki ? "yok" : m)), 680);
  }, []);

  const yolRef = useRef(yol);

  // Varış: beklenen sayfa hazır + en az süre dolmuşsa perdeyi kaldır
  const varisiDene = useCallback(() => {
    const m = modRef.current;
    if (m !== "geldi" && m !== "ucus") return;
    if (beklenen.current !== yolRef.current || hazirYol.current !== beklenen.current) return;
    const gecen = performance.now() - baslangic.current;
    const enAz = m === "ucus" ? EN_AZ_UCUS : EN_AZ_GELIS;
    setTimeout(() => kapat(m === "ucus" ? "bitis" : "acilis"), Math.max(0, enAz - gecen));
  }, [kapat]);

  useEffect(() => {
    yolRef.current = yol;
    varisiDene();
  }, [yol, varisiDene]);

  useEffect(() => {
    baslangic.current = performance.now();
    const hazir = (e: Event) => {
      hazirYol.current = (e as CustomEvent<string>).detail;
      varisiDene();
    };
    window.addEventListener(OLAY, hazir);
    if (sonHazirYol) {
      hazirYol.current = sonHazirYol;
      varisiDene();
    }
    // Güvenlik: hazır sinyali hiç gelmezse perde sonsuza kadar kalmasın
    const yedek = setTimeout(() => {
      if (modRef.current === "geldi") kapat("acilis");
    }, EN_FAZLA_BEKLEME);
    return () => {
      window.removeEventListener(OLAY, hazir);
      clearTimeout(yedek);
    };
  }, [varisiDene, kapat]);

  const git = useCallback(
    (hedefYol: string) => {
      const temiz = "/" + yolSlug(hedefYol);
      const h = temiz === "/" ? { slug: "", ad: "Ana sayfa", gidis: "Ana sayfaya", bayrak: "tr" } : bul(temiz);
      setHedef(h);
      ucakSesi();
      baslangic.current = performance.now();
      beklenen.current = temiz;
      hazirYol.current = null;
      setMod("ucus");
      router.prefetch(temiz);
      setTimeout(() => router.push(temiz), hareketAz() ? 150 : 900);
      setTimeout(() => {
        if (modRef.current === "ucus") kapat("bitis");
      }, EN_FAZLA_BEKLEME + 900);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, kapat, hedefler],
  );

  useEffect(() => {
    disaridanGit = git;
    // Site içi bağlantılara tıklamayı yakala (Next Link, SVG <a> hepsi)
    const tik = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.getAttribute("target") ?? "") === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      const hedefYol = href.split("#")[0] || "/";
      if (hedefYol === yolRef.current) return;
      const slug = yolSlug(hedefYol);
      if (slug !== "" && !hedefler.some((h) => h.slug === slug)) return; // ülke veya ana sayfa değil
      e.preventDefault();
      git(hedefYol);
    };
    document.addEventListener("click", tik, true);
    return () => {
      document.removeEventListener("click", tik, true);
      disaridanGit = null;
    };
  }, [git, hedefler]);

  const gorunur = mod !== "yok";
  const yazi =
    mod === "ucus" || mod === "bitis"
      ? hedef?.slug === ""
        ? "Ana sayfaya dönüyoruz!"
        : `${hedef?.gidis ?? ""} uçuyoruz!`
      : `${hedef?.gidis ?? ""} hoş geldin!`;

  return (
    <>
      {children}
      {gorunur && (
        <div className={s.perde} data-mod={mod} role="status" aria-live="polite">
          <div className={s.gok} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Bulut key={i} className={`${s.akanBulut} ${s[`ak${i}`]}`} />
            ))}
            <span className={`${s.cizgi} ${s.c1}`} />
            <span className={`${s.cizgi} ${s.c2}`} />
            <span className={`${s.cizgi} ${s.c3}`} />
          </div>

          <div className={s.orta}>
            <Ucak className={s.ucak} />
            <p className={s.yazi}>
              {hedef?.bayrak && <img src={`/bayrak/${hedef.bayrak}.svg`} alt="" />}
              <span>{yazi}</span>
            </p>
            <p className={s.altYazi}>{mod === "ucus" ? "Kemerlerinizi bağlayın" : "İniş yapıyoruz..."}</p>
          </div>
        </div>
      )}
    </>
  );
}
