/**
 * Zeytin dalı illüstrasyonu (kodla çizilir). Hero'da 3D sahne yüklenene kadar
 * ve mobilde / "hareketi azalt" ayarında tek başına görünür.
 */
const P = [
  [40, 118],
  [200, 66],
  [370, 176],
  [572, 372],
] as const;

function point(t: number) {
  const u = 1 - t;
  const x = u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0];
  const y = u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1];
  const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
  const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const round = (n: number) => Math.round(n * 10) / 10;
const LEAF = "M0 0C26-19 86-21 118 0C86 21 26 19 0 0Z";
const GREENS = ["#5d7343", "#6c8350", "#4c6238"];
const SILVER = "#aebaa4";

const leaves = Array.from({ length: 17 }, (_, i) => {
  const t = 0.07 + i * 0.055;
  const p = point(t);
  const side = i % 2 === 0 ? -1 : 1;
  const spread = 44 + ((i * 37) % 22);
  const scale = 1.08 - t * 0.42 + ((i * 13) % 7) / 50;
  return {
    key: i,
    transform: `translate(${round(p.x)} ${round(p.y)}) rotate(${round(p.angle + side * spread)}) scale(${round(scale)})`,
    fill: i % 5 === 3 ? SILVER : GREENS[i % 3],
  };
});

const tip = point(1);
const olives = [
  { t: 0.3, len: 26, fill: "#6f7d2c", rx: 15, ry: 20 },
  { t: 0.47, len: 34, fill: "#3b2b40", rx: 16, ry: 21 },
  { t: 0.56, len: 22, fill: "#586328", rx: 14, ry: 19 },
  { t: 0.74, len: 30, fill: "#2f2436", rx: 15, ry: 20 },
].map((o) => ({ ...o, ...point(o.t) }));

export function BranchArt({ className = "" }: { className?: string }) {
  const drop = olives[1];
  return (
    <svg viewBox="0 0 620 520" className={className} role="img" aria-label="Zeytin dalı ve dalın ucundan süzülen bir damla zeytinyağı illüstrasyonu">
      <defs>
        <radialGradient id="branch-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e0a526" stopOpacity="0.38" />
          <stop offset="1" stopColor="#e0a526" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="oil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d27a" />
          <stop offset="1" stopColor="#d9950f" />
        </linearGradient>
      </defs>
      <circle cx="330" cy="270" r="250" fill="url(#branch-glow)" />
      <g className="art-sway">
        <path
          d={`M${P[0].join(" ")}C${P[1].join(" ")} ${P[2].join(" ")} ${P[3].join(" ")}`}
          fill="none"
          stroke="#6b5637"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {leaves.map((l) => (
          <g key={l.key} transform={l.transform}>
            <path d={LEAF} fill={l.fill} />
            <path d="M4 0H112" stroke="#12263a" strokeOpacity="0.22" strokeWidth="1.5" />
          </g>
        ))}
        <g transform={`translate(${round(tip.x)} ${round(tip.y)}) rotate(${round(tip.angle)}) scale(0.62)`}>
          <path d={LEAF} fill={GREENS[1]} />
        </g>
        {olives.map((o) => (
          <g key={o.t}>
            <path d={`M${round(o.x)} ${round(o.y)}v${o.len}`} stroke="#6b5637" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx={round(o.x)} cy={round(o.y + o.len + o.ry - 2)} rx={o.rx} ry={o.ry} fill={o.fill} />
            <ellipse cx={round(o.x - 5)} cy={round(o.y + o.len + o.ry - 9)} rx="3.5" ry="6" fill="#fff" fillOpacity="0.35" />
          </g>
        ))}
        <g transform={`translate(${round(drop.x)} ${round(drop.y + drop.len + drop.ry * 2 + 2)})`}>
          <g className="art-drip">
            <path d="M0 0C9 14 14 22 14 31a14 14 0 1 1-28 0C-14 22-9 14 0 0Z" fill="url(#oil)" />
            <path d="M-6 30a7 7 0 0 0 5 7" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
