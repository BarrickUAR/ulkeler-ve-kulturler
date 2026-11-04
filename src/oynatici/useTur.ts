"use client";

import { animate, type AnimationPlaybackControls } from "motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Adim, Kelime, Ulke } from "@/icerik/sema";
import { efektOynat, type Oynatim } from "@/efektler/efektler";
import { SAHNELER } from "@/efektler/sahneler";
import { hedefHesapla, TUM } from "./kamera";
import { Anlatici } from "./ses";

export type Durum = "hazir" | "oynuyor" | "duraklatildi" | "bitti";

const sade = (s: string) => s.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");

function hareketAzMi(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("azhareket");
}

export function useTur(ulke: Ulke, kelimeler: Record<string, Kelime[]>) {
  const [durum, setDurum] = useState<Durum>("hazir");
  const [aktif, setAktif] = useState(-1);
  const [kelimeIndeks, setKelimeIndeks] = useState(-1);
  const [sessiz, setSessiz] = useState(false);
  const [serbestMetin, setSerbestMetin] = useState<string | null>(null);

  const kameraRef = useRef<HTMLDivElement>(null);
  const karakterAlaniRef = useRef<HTMLDivElement>(null);
  const katmanlar = useRef(new Map<string, HTMLElement>());
  const anlatici = useRef<Anlatici | null>(null);
  const token = useRef(0);
  const durumRef = useRef<Durum>("hazir");
  const aktifRef = useRef(-1);
  const adimSuruyor = useRef(false);
  const oynatimlar = useRef<Oynatim[]>([]);
  const kameraKontrol = useRef<AnimationPlaybackControls | null>(null);
  const raf = useRef(0);

  const adimlar = ulke.adimlar;
  const sesYolu = (a: Adim) => `/ses/${ulke.slug}/${a.id}.mp3`;

  const durumYap = (d: Durum) => {
    durumRef.current = d;
    setDurum(d);
  };
  const aktifYap = (i: number) => {
    aktifRef.current = i;
    setAktif(i);
  };

  const ses = () => (anlatici.current ??= new Anlatici());

  const katmanKaydet = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) katmanlar.current.set(id, el);
    else katmanlar.current.delete(id);
  }, []);

  /** Sadece oynarken ilerleyen bekleme (duraklatınca sayaç durur). */
  const bekle = (ms: number, t: number) =>
    new Promise<boolean>((coz) => {
      let kalan = ms;
      let son = performance.now();
      const id = setInterval(() => {
        const simdi = performance.now();
        if (durumRef.current === "oynuyor") kalan -= simdi - son;
        son = simdi;
        if (token.current !== t) {
          clearInterval(id);
          coz(false);
        } else if (kalan <= 0) {
          clearInterval(id);
          coz(true);
        }
      }, 50);
    });

  const kameraGit = useCallback(
    (odak: string) => {
      const el = kameraRef.current;
      if (!el) return Promise.resolve();
      const oge = ulke.ogeler.find((o) => o.id === odak);
      const h = odak === "tum" || !oge ? TUM : hedefHesapla(oge.kutu);
      kameraKontrol.current?.stop();
      const k = animate(
        el,
        { x: `${h.x * 100}%`, y: `${h.y * 100}%`, scale: h.olcek },
        { duration: hareketAzMi() ? 0 : 0.8, ease: [0.33, 0, 0.2, 1] },
      );
      kameraKontrol.current = k;
      return k.finished.catch(() => {});
    },
    [ulke.ogeler],
  );

  const efektBaslat = useCallback(
    (ids: string[]) => {
      for (const id of ids) {
        const oge = ulke.ogeler.find((o) => o.id === id);
        const katman = katmanlar.current.get(id);
        if (oge && katman) oynatimlar.current.push(efektOynat(oge, katman, hareketAzMi()));
      }
    },
    [ulke.ogeler],
  );

  const hepsiniTemizle = () => {
    cancelAnimationFrame(raf.current);
    oynatimlar.current.forEach((o) => o.temizle());
    oynatimlar.current = [];
    anlatici.current?.durdur();
  };

  const adimOynat = useCallback(
    async (i: number, tek = false): Promise<void> => {
      const t = ++token.current;
      hepsiniTemizle();
      setSerbestMetin(null);
      const adim = adimlar[i];
      aktifYap(i);
      setKelimeIndeks(-1);
      durumYap("oynuyor");
      adimSuruyor.current = true;

      await kameraGit(adim.odak);
      if (token.current !== t) return;

      efektBaslat(adim.efektler);
      if (adim.sahne) {
        const katman = katmanlar.current.get(adim.odak);
        if (katman)
          oynatimlar.current.push(
            SAHNELER[adim.sahne]({ katman, karakterAlani: karakterAlaniRef.current, azHareket: hareketAzMi() }),
          );
      }
      const sonraki = adimlar[i + 1];
      if (sonraki) ses().onYukle(sesYolu(sonraki));

      // Altyazı + ses içi geçişler
      const zamanlar = kelimeler[adim.id] ?? [];
      const araKelime = adim.ara.map((a) => {
        const k = zamanlar.find((z) => sade(z.w).startsWith(sade(a.kelime)));
        return { ...a, t: k ? k.t : Infinity, oldu: false };
      });
      const dongu = () => {
        if (token.current !== t) return;
        const ms = ses().zaman * 1000;
        let k = -1;
        for (let j = 0; j < zamanlar.length; j++) if (zamanlar[j].t <= ms) k = j;
        setKelimeIndeks(k);
        for (const a of araKelime) {
          if (!a.oldu && ms >= a.t) {
            a.oldu = true;
            if (a.odak) void kameraGit(a.odak);
            if (a.efektler) efektBaslat(a.efektler);
          }
        }
        raf.current = requestAnimationFrame(dongu);
      };
      raf.current = requestAnimationFrame(dongu);

      const sesBitti = ses().cal(sesYolu(adim), adim.okunus ?? adim.metin);
      await Promise.all([sesBitti, bekle(1400, t), ...oynatimlar.current.map((o) => o.bitti)]);
      if (token.current !== t) return;
      cancelAnimationFrame(raf.current);
      setKelimeIndeks(zamanlar.length);
      adimSuruyor.current = false;

      if (tek) {
        durumYap("duraklatildi");
        return;
      }
      if (!(await bekle(500, t))) return;
      if (i + 1 < adimlar.length) return adimOynat(i + 1);
      await kameraGit("tum");
      if (token.current === t) durumYap("bitti");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adimlar, kameraGit, efektBaslat, kelimeler],
  );

  const kilidiAc = () => ses().kilidiAc(sesYolu(adimlar[0]));

  const oynatDuraklat = useCallback(() => {
    kilidiAc();
    const d = durumRef.current;
    if (d === "oynuyor") {
      durumYap("duraklatildi");
      ses().duraklat();
      oynatimlar.current.forEach((o) => o.kontroller.forEach((k) => k.pause()));
      kameraKontrol.current?.pause();
      return;
    }
    if (d === "duraklatildi") {
      if (adimSuruyor.current) {
        durumYap("oynuyor");
        ses().surdur();
        oynatimlar.current.forEach((o) => o.kontroller.forEach((k) => k.play()));
        kameraKontrol.current?.play();
      } else {
        void adimOynat(Math.min(adimlar.length - 1, aktifRef.current + 1));
      }
      return;
    }
    void adimOynat(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adimOynat, adimlar.length]);

  const git = useCallback(
    (yon: 1 | -1) => {
      kilidiAc();
      const i = Math.max(0, Math.min(adimlar.length - 1, (aktifRef.current < 0 ? -1 : aktifRef.current) + yon));
      void adimOynat(i);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adimOynat, adimlar.length],
  );

  /** Resimdeki bir nesneye dokunma: o nesnenin adımı tek başına oynar. */
  const ogeSec = useCallback(
    (id: string) => {
      kilidiAc();
      const i = adimlar.findIndex((a) => a.odak === id);
      if (i >= 0) {
        void adimOynat(i, true);
        return;
      }
      // Anlatımı olmayan nesne: yaklaş, kıpırdat, etiketini göster
      ++token.current;
      hepsiniTemizle();
      const oge = ulke.ogeler.find((o) => o.id === id);
      setSerbestMetin(oge?.etiket ?? null);
      durumYap("duraklatildi");
      adimSuruyor.current = false;
      void kameraGit(id).then(() => efektBaslat([id]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adimOynat, adimlar, kameraGit, efektBaslat, ulke.ogeler],
  );

  const sessizDegistir = useCallback(() => {
    setSessiz((s) => {
      ses().sessizYap(!s);
      return !s;
    });
  }, []);

  useEffect(
    () => () => {
      ++token.current;
      cancelAnimationFrame(raf.current);
      anlatici.current?.durdur();
    },
    [],
  );

  return {
    durum,
    aktif,
    aktifAdim: aktif >= 0 ? adimlar[aktif] : null,
    kelimeIndeks,
    serbestMetin,
    sessiz,
    kameraRef,
    karakterAlaniRef,
    katmanKaydet,
    oynatDuraklat,
    git,
    ogeSec,
    sessizDegistir,
  };
}
