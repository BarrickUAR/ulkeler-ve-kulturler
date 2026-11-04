/** Burçe'nin defterdeki işaretleri: paragrafın başındaki yıldız ve yuvarlak soru işareti. */

export function Yildiz({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M12.2 3.4c-.1 5.8-.3 11.5-.4 17.3" />
      <path d="M4.6 7.6c4.9 2.9 9.9 5.8 14.8 8.6" />
      <path d="M19.1 7.2c-4.8 3-9.7 5.9-14.6 8.8" />
    </svg>
  );
}

export function YuvarlakSoru({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M20.5 3.2c9.3-.4 16.4 6.8 16.3 16.4-.1 9.4-7.4 17-16.9 17.1C10.6 36.8 3.4 29.6 3.3 20.4 3.2 11 10 3.8 20 3.1" />
      <path d="M15.2 15.1c.4-3.4 3.2-5.3 6.1-4.8 3 .5 4.6 3.2 3.5 5.9-1 2.4-4 3.3-4.6 6.1-.1.7-.1 1.4 0 2.1" />
      <path d="M20.3 29.2v.4" strokeWidth="2.6" />
    </svg>
  );
}

/** Arayüz ikonları (lucide çizgisi: 24 grid, 1.75 kalınlık). */
export function Ikon({ ad }: { ad: "oynat" | "duraklat" | "geri" | "ileri" | "ses" | "sessiz" | "bastan" | "tamekran" }) {
  const yollar: Record<string, React.ReactNode> = {
    oynat: <path d="M7 4.5v15l12.5-7.5L7 4.5Z" fill="currentColor" stroke="none" />,
    duraklat: (
      <>
        <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
        <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
      </>
    ),
    geri: <path d="m15 18-6-6 6-6" />,
    ileri: <path d="m9 18 6-6-6-6" />,
    ses: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ),
    sessiz: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="m22 9-6 6" />
        <path d="m16 9 6 6" />
      </>
    ),
    bastan: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    tamekran: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {yollar[ad]}
    </svg>
  );
}
