"use client";

/** Gezilen ülkeler (turu sonuna kadar dinlenenler) bu tarayıcıda saklanır. Depolama yoksa sessizce çalışmaz. */
const ANAHTAR = "ulkeler-pasaport";
const OLAY = "pasaport-degisti";

export function gezilenler(): string[] {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    const liste = ham ? (JSON.parse(ham) as unknown) : [];
    return Array.isArray(liste) ? liste.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function damgala(slug: string): void {
  try {
    const liste = gezilenler();
    if (!liste.includes(slug)) {
      liste.push(slug);
      localStorage.setItem(ANAHTAR, JSON.stringify(liste));
    }
    window.dispatchEvent(new Event(OLAY));
  } catch {
    /* gizli sekme vb. */
  }
}

export function pasaportuDinle(fn: () => void): () => void {
  window.addEventListener(OLAY, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(OLAY, fn);
    window.removeEventListener("storage", fn);
  };
}
