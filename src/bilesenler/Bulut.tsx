/** Kapaktaki gibi yumuşak, düz beyaz bulut. */
export function Bulut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 80" aria-hidden="true">
      <g fill="#ffffff">
        <circle cx="48" cy="48" r="24" />
        <circle cx="78" cy="34" r="30" />
        <circle cx="112" cy="46" r="22" />
        <rect x="24" y="48" width="112" height="24" rx="12" />
      </g>
      <path d="M30 70h100" stroke="#d7e9f8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
