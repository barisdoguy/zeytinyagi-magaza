/** Yukarıdan sofra illüstrasyonu. Gerçek fotoğraf yüklenince yerini ona bırakır. */
export function TableArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 640" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Yukarıdan görünen sofra illüstrasyonu: bir kâse zeytinyağı, ekmek dilimleri, domates ve zeytinler">
      <rect width="800" height="640" fill="#e7dcc6" />
      <g stroke="#c8452c" strokeOpacity="0.16" strokeWidth="26">
        <path d="M150 0V640M410 0V640M670 0V640" />
        <path d="M0 150H800M0 410H800" />
      </g>
      {/* yağ kâsesi */}
      <circle cx="400" cy="320" r="150" fill="#12263a" />
      <circle cx="400" cy="320" r="128" fill="#e0a526" />
      <path d="M318 300a86 86 0 0 1 96-70" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="10" strokeLinecap="round" />
      <circle cx="452" cy="366" r="13" fill="#f6d27a" />
      <circle cx="372" cy="384" r="7" fill="#f6d27a" />
      {/* ekmek */}
      <g transform="rotate(-18 150 180)">
        <rect x="60" y="120" width="190" height="112" rx="52" fill="#d9a55b" />
        <rect x="76" y="136" width="158" height="80" rx="38" fill="#f2dcae" />
      </g>
      <g transform="rotate(12 190 500)">
        <rect x="80" y="450" width="190" height="112" rx="52" fill="#d9a55b" />
        <rect x="96" y="466" width="158" height="80" rx="38" fill="#f2dcae" />
      </g>
      {/* domates */}
      <g>
        <circle cx="640" cy="170" r="62" fill="#c8452c" />
        <circle cx="640" cy="170" r="44" fill="#e2684f" />
        <g fill="#f3ede0" fillOpacity="0.8">
          <ellipse cx="622" cy="156" rx="7" ry="11" />
          <ellipse cx="658" cy="158" rx="7" ry="11" />
          <ellipse cx="640" cy="190" rx="7" ry="11" />
        </g>
      </g>
      {/* zeytinler */}
      <g>
        <ellipse cx="620" cy="470" rx="24" ry="30" fill="#2f2436" transform="rotate(20 620 470)" />
        <ellipse cx="682" cy="512" rx="22" ry="28" fill="#586328" transform="rotate(-25 682 512)" />
        <ellipse cx="606" cy="544" rx="22" ry="28" fill="#3b2b40" transform="rotate(50 606 544)" />
      </g>
      {/* dal */}
      <g transform="translate(470 80) rotate(24)">
        <path d="M0 0H170" stroke="#6b5637" strokeWidth="5" strokeLinecap="round" />
        {[20, 60, 100, 140].map((x, i) => (
          <path key={x} d="M0 0C14-11 44-12 60 0C44 12 14 11 0 0Z" fill={i % 2 ? "#8fa08a" : "#5d7343"} transform={`translate(${x} 0) rotate(${i % 2 ? 40 : -40})`} />
        ))}
      </g>
    </svg>
  );
}
