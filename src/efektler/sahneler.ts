import { animate, type AnimationPlaybackControls } from "motion";
import type { Oynatim } from "./efektler";

/**
 * Karakter görselleri ailenin ürettiği PNG'ler gelince true yapılır
 * (public/img/karakter/<ad>-a.webp ve <ad>-b.webp). Yokken sahne yalnız nesneyle oynar.
 */
export const KARAKTER_HAZIR: Record<string, boolean> = {
  futbolcu: false,
  leonardo: false,
};

type SahneGirdi = {
  /** Sahnenin ana nesnesinin katmanı (top, tablo...). */
  katman: HTMLElement;
  /** Kamera çerçevesinin içinde, sahne koordinatında karakterin duracağı katman. */
  karakterAlani: HTMLElement | null;
  azHareket: boolean;
};

const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function kesikVeAlt(katman: HTMLElement) {
  const kesik = katman.querySelector<HTMLElement>("[data-kesik]")!;
  const alt = katman.querySelector<HTMLElement>("[data-alt]");
  return { kesik, alt };
}

function karakterOlustur(alan: HTMLElement, ad: string): { kok: HTMLElement; a: HTMLImageElement; b: HTMLImageElement } {
  const kok = document.createElement("div");
  kok.className = "karakter";
  const a = new Image();
  a.src = `/img/karakter/${ad}-a.webp`;
  a.alt = "";
  const b = new Image();
  b.src = `/img/karakter/${ad}-b.webp`;
  b.alt = "";
  b.style.opacity = "0";
  kok.append(a, b);
  alan.appendChild(kok);
  return { kok, a, b };
}

/** ABD: futbolcu gelir, topu fırlatır; top yay çizip döner ve yerine sekerek iner. */
function futbolcuAtis({ katman, karakterAlani, azHareket }: SahneGirdi): Oynatim {
  const { kesik, alt } = kesikVeAlt(katman);
  const kontroller: AnimationPlaybackControls[] = [];
  let karakter: ReturnType<typeof karakterOlustur> | null = null;
  let iptal = false;

  const temizle = () => {
    iptal = true;
    kontroller.forEach((k) => k.stop());
    kesik.style.transform = "";
    kesik.style.opacity = "0";
    if (alt) alt.style.opacity = "0";
    karakter?.kok.remove();
  };

  if (azHareket) return { kontroller, bitti: Promise.resolve(), temizle };

  const bitti = (async () => {
    kesik.style.transformOrigin = "50% 50%";
    kesik.style.opacity = "1";
    if (alt) alt.style.opacity = "1";

    if (KARAKTER_HAZIR.futbolcu && karakterAlani) {
      karakter = karakterOlustur(karakterAlani, "futbolcu");
      const giris = animate(karakter.kok, { x: ["-120%", "0%"], opacity: [0, 1] }, { duration: 0.6, ease: "easeOut" });
      kontroller.push(giris);
      await giris.finished;
      if (iptal) return;
      await bekle(250);
      karakter.a.style.opacity = "0";
      karakter.b.style.opacity = "1";
    } else {
      // Karakter yokken top önce yerinde gerilir (atışa hazırlık)
      const hazirlik = animate(kesik, { rotate: [0, -14], x: ["0%", "-6%"] }, { duration: 0.45, ease: "easeOut" });
      kontroller.push(hazirlik);
      await hazirlik.finished;
      if (iptal) return;
    }

    const ucus = animate(
      kesik,
      {
        x: ["-6%", "60%", "140%", "190%", "120%", "40%", "0%", "0%"],
        y: ["0%", "-120%", "-190%", "-140%", "-40%", "0%", "-14%", "0%"],
        rotate: [-14, 120, 300, 470, 610, 700, 715, 720],
        scale: [1, 1.12, 1.18, 1.12, 1.04, 1, 1, 1],
      },
      { duration: 2.4, times: [0, 0.16, 0.32, 0.46, 0.66, 0.84, 0.92, 1], ease: "easeInOut" },
    );
    kontroller.push(ucus);

    if (karakter) {
      const cikis = animate(karakter.kok, { x: ["0%", "-130%"], opacity: [1, 0] }, { duration: 0.6, delay: 1.0, ease: "easeIn" });
      kontroller.push(cikis);
    }

    await ucus.finished;
    if (iptal) return;
    kesik.style.transform = "";
    kesik.style.opacity = "0";
    if (alt) alt.style.opacity = "0";
    karakter?.kok.remove();
  })().catch(() => {});

  return { kontroller, bitti, temizle };
}

export const SAHNELER = {
  "futbolcu-atis": futbolcuAtis,
  // Fransa sahnesi Fransa içeriği eklenince yazılacak
  "leonardo-boyar": (g: SahneGirdi): Oynatim => ({ kontroller: [], bitti: Promise.resolve(), temizle: () => void g }),
} as const;

export type SahneAdi = keyof typeof SAHNELER;
