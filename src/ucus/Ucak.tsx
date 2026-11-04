/** Çizgi film yolcu uçağı (sağa bakar). */
export function Ucak({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 120" aria-hidden="true">
      <g stroke="#17295c" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* arka kanat */}
        <path d="M118 58 L84 18 L102 16 L146 56 Z" fill="#c9d7ef" />
        {/* kuyruk */}
        <path d="M40 60 L22 22 L40 22 L66 56 Z" fill="#e2403b" />
        <path d="M44 66 L22 74 L30 80 L58 72 Z" fill="#c9d7ef" />
        {/* gövde */}
        <path d="M30 60 C30 50 46 46 70 46 L182 46 C206 46 222 54 226 64 C222 74 206 80 182 80 L70 80 C46 80 30 72 30 60 Z" fill="#ffffff" />
        {/* kokpit camı */}
        <path d="M198 52 C208 53 216 57 219 62 L200 62 C196 62 194 58 198 52 Z" fill="#86c9f0" />
        {/* ön kanat */}
        <path d="M110 66 L148 104 L170 104 L146 66 Z" fill="#ffcd2e" />
        {/* motor */}
        <rect x="132" y="84" width="30" height="13" rx="6.5" fill="#c9d7ef" />
      </g>
      {/* pencereler */}
      <g fill="#86c9f0" stroke="#17295c" strokeWidth="2.5">
        <circle cx="82" cy="59" r="5" />
        <circle cx="102" cy="59" r="5" />
        <circle cx="122" cy="59" r="5" />
        <circle cx="142" cy="59" r="5" />
        <circle cx="162" cy="59" r="5" />
        <circle cx="182" cy="59" r="5" />
      </g>
      <path d="M44 70 H206" stroke="#e2403b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
