/** Kazdağı – zeytinlik – körfez illüstrasyonu. Gerçek fotoğraf yüklenince yerini ona bırakır. */
const trees = Array.from({ length: 34 }, (_, i) => {
  const row = Math.floor(i / 9);
  const col = i % 9;
  return { x: 70 + col * 82 + (row % 2) * 40 + ((i * 17) % 13), y: 372 + row * 34 + ((i * 7) % 9), r: 15 + ((i * 5) % 6) };
});

export function LandscapeArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 640" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Arkada Kazdağı, yamaçta zeytinlikler ve önde Edremit Körfezi'ni gösteren illüstrasyon">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d79a" />
          <stop offset="1" stopColor="#f3ede0" />
        </linearGradient>
      </defs>
      <rect width="800" height="640" fill="url(#sky)" />
      <circle cx="610" cy="150" r="64" fill="#e0a526" />
      <path d="M0 330C90 250 150 190 250 150c60-24 96 20 150 40 70 26 110-60 190-50 90 12 140 110 210 150v90H0Z" fill="#8fa08a" />
      <path d="M0 370c110-70 190-120 300-110 80 8 120 60 200 60 110 0 180-70 300-40v140H0Z" fill="#5d7343" />
      <path d="M0 420c140-50 260-60 400-40s280 10 400-20v170H0Z" fill="#2f3b24" />
      {trees.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={t.r} fill={i % 3 === 0 ? "#8fa08a" : "#6c8350"} />
          <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.45} fill="#aebaa4" fillOpacity="0.55" />
        </g>
      ))}
      <path d="M0 520c130-22 270-22 400-6s270 16 400-10v136H0Z" fill="#12263a" />
      <g fill="none" stroke="#f3ede0" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round">
        <path d="M60 566q24-10 48 0t48 0" />
        <path d="M330 590q24-10 48 0t48 0t48 0" />
        <path d="M600 560q24-10 48 0t48 0" />
      </g>
    </svg>
  );
}
