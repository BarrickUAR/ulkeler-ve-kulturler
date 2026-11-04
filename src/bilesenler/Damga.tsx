/** Pasaport damgası: çift halka, ortada GEZİLDİ, çevresinde ülke adı. */
export function Damga({ ulke, className }: { ulke: string; className?: string }) {
  const id = `damga-${ulke.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 120 120" aria-label={`${ulke} gezildi`} role="img">
      <defs>
        <path id={id} d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
      </defs>
      <g fill="none" stroke="#d6332f" strokeWidth="4">
        <circle cx="60" cy="60" r="55" />
        <circle cx="60" cy="60" r="33" strokeWidth="2.5" />
      </g>
      <text fill="#d6332f" fontFamily="var(--font-cizgi)" fontWeight="800" fontSize="13" letterSpacing="2">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {`★ ${ulke.toLocaleUpperCase("tr")} ★ ÜLKELER VE KÜLTÜRLER`}
        </textPath>
      </text>
      <text x="60" y="66" textAnchor="middle" fill="#d6332f" fontFamily="var(--font-cizgi)" fontWeight="800" fontSize="15" letterSpacing="0.5">
        GEZİLDİ
      </text>
    </svg>
  );
}
