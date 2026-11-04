import { animate, type AnimationPlaybackControls } from "motion";
import type { Oge } from "@/icerik/sema";

/** Bir efekt oynatımının denetimi: duraklat/sürdür/iptal ve bitiş sözü. */
export type Oynatim = {
  kontroller: AnimationPlaybackControls[];
  bitti: Promise<void>;
  temizle: () => void;
};

const BOS: Oynatim = { kontroller: [], bitti: Promise.resolve(), temizle: () => {} };

function parcalar(katman: HTMLElement) {
  return {
    kesik: katman.querySelector<HTMLElement>("[data-kesik]"),
    alt: katman.querySelector<HTMLElement>("[data-alt]"),
  };
}

function goster(el: HTMLElement | null, gorunur: boolean) {
  if (el) el.style.opacity = gorunur ? "1" : "0";
}

/** Nesnenin ses notası, buhar gibi parçacıkları için geçici öğe üretir. */
function parcacik(katman: HTMLElement, sinif: string, metin: string, sol: number, ust: number): HTMLElement {
  const s = document.createElement("span");
  s.className = sinif;
  s.textContent = metin;
  s.setAttribute("aria-hidden", "true");
  s.style.left = `${sol * 100}%`;
  s.style.top = `${ust * 100}%`;
  katman.appendChild(s);
  return s;
}

export function efektOynat(oge: Oge, katman: HTMLElement, azHareket: boolean): Oynatim {
  const efekt = oge.efekt;
  if (!efekt || azHareket) return BOS;
  const { kesik, alt } = parcalar(katman);
  if (!kesik) return BOS;

  const tekrar = efekt.tekrar ?? 1;
  const [mx, my] = efekt.merkez ?? (efekt.tip === "don" ? [0.5, 0.5] : [0.5, 0.95]);
  kesik.style.transformOrigin = `${mx * 100}% ${my * 100}%`;
  goster(kesik, true);

  const kontroller: AnimationPlaybackControls[] = [];
  const eklenenler: HTMLElement[] = [];
  const ease = [0.33, 0, 0.2, 1] as const;

  switch (efekt.tip) {
    case "zipla":
      goster(alt, true);
      kontroller.push(
        animate(
          kesik,
          { y: ["0%", "-16%", "0%", "-6%", "0%"], scaleY: [1, 1.03, 0.94, 1.01, 1], scaleX: [1, 0.98, 1.04, 1, 1] },
          { duration: 0.95, times: [0, 0.32, 0.6, 0.8, 1], ease: "easeOut", repeat: tekrar - 1, repeatDelay: 0.25 },
        ),
      );
      break;
    case "salla":
      kontroller.push(
        animate(kesik, { rotate: [0, -5, 4, -3, 2, 0] }, { duration: 1.6, ease: "easeInOut", repeat: tekrar - 1 }),
      );
      break;
    case "don":
      kontroller.push(animate(kesik, { rotate: [0, 360] }, { duration: 2.4, ease, repeat: tekrar - 1 }));
      break;
    case "belir":
      kontroller.push(
        animate(kesik, { scale: [1, 1.09, 1] }, { duration: 1.0, ease: "easeInOut", times: [0, 0.45, 1], repeat: tekrar - 1 }),
      );
      break;
    case "titre":
      kontroller.push(
        animate(kesik, { x: ["0%", "-2%", "2%", "-1.5%", "1.5%", "0%"] }, { duration: 0.45, repeat: tekrar * 2 - 1, repeatDelay: 0.2 }),
      );
      break;
    case "notalar": {
      const isaretler = ["♪", "♫", "♪", "♬"];
      isaretler.forEach((n, i) => {
        const s = parcacik(katman, "nota", n, 0.55 + (i % 2) * 0.2, 0.05 + (i % 3) * 0.04);
        eklenenler.push(s);
        kontroller.push(
          animate(
            s,
            { y: ["0%", "-180%"], x: ["0%", `${(i % 2 ? 1 : -1) * 40}%`], opacity: [0, 1, 1, 0], rotate: [0, i % 2 ? 12 : -12] },
            { duration: 1.8, delay: i * 0.32, ease: "easeOut" },
          ),
        );
      });
      kontroller.push(animate(kesik, { rotate: [0, -3, 2, -2, 0] }, { duration: 1.6, ease: "easeInOut" }));
      break;
    }
    case "buhar": {
      [0, 1, 2].forEach((i) => {
        const s = parcacik(katman, "buhar", "", 0.3 + i * 0.2, 0.05);
        eklenenler.push(s);
        kontroller.push(
          animate(
            s,
            { y: ["0%", "-140%"], opacity: [0, 0.75, 0], scaleX: [0.8, 1.2] },
            { duration: 2.0, delay: i * 0.4, ease: "easeOut", repeat: tekrar - 1 },
          ),
        );
      });
      break;
    }
    case "fener": {
      const huzme = parcacik(katman, "fener", "", 0.5, 0.18);
      eklenenler.push(huzme);
      kontroller.push(animate(huzme, { rotate: [-60, 60, -60], opacity: [0, 0.6, 0.6, 0] }, { duration: 3.2, ease: "easeInOut" }));
      break;
    }
  }

  const temizle = () => {
    kontroller.forEach((k) => k.stop());
    eklenenler.forEach((e) => e.remove());
    kesik.style.transform = "";
    goster(kesik, false);
    goster(alt, false);
  };

  const bitti = Promise.all(kontroller.map((k) => k.finished.catch(() => {}))).then(() => {
    // Hareket bitti: kesik orijinalle aynı yerde, katmanı gizle
    eklenenler.forEach((e) => e.remove());
    goster(kesik, false);
    goster(alt, false);
  });

  return { kontroller, bitti, temizle };
}
