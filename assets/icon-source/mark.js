/* eslint-env node */
// "Plant friends": two potted sprouts with faces, leaning in so their inner
// leaves touch. Drawn in a 1024 box; `scale` shrinks it around the centre.
const light = {
  leaf: "#F6F4EE",
  leaf2: "#CFE6C8",
  rib: "#3D6B47",
  pot: "#F6F4EE",
  rim: "#DDE9DA",
  face: "#2E5537",
  cheek: "#E8A99A",
};
const dark = {
  leaf: "#3D6B47",
  leaf2: "#6E9C77",
  rib: "#F6F4EE",
  pot: "#3D6B47",
  rim: "#2E5537",
  face: "#F6F4EE",
  cheek: "#E8A99A",
};

const plant = (c, x, lean, flip) => `
  <g transform="translate(${x} 0) rotate(${lean} 0 760)">
    <path d="M0 600 C0 540 ${flip * -4} 480 0 420" stroke="${c.leaf}" stroke-width="30" stroke-linecap="round" fill="none"/>
    <g transform="scale(${flip} 1)">
      <path d="M-4 470 C-70 480 -160 440 -185 330 C-80 315 -10 380 -4 470 Z" fill="${c.leaf2}"/>
      <path d="M-14 462 C-70 440 -120 400 -155 350" stroke="${c.rib}" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M4 440 C0 345 55 275 140 262 C150 355 95 432 4 440 Z" fill="${c.leaf}"/>
      <path d="M16 426 C50 380 85 330 125 282" stroke="${c.rib}" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.5"/>
    </g>
    <path d="M-120 625 L120 625 L95 800 Q92 820 72 820 L-72 820 Q-92 820 -95 800 Z" fill="${c.pot}"/>
    <rect x="-135" y="585" width="270" height="62" rx="18" fill="${c.rim}"/>
    <circle cx="-38" cy="705" r="13" fill="${c.face}"/>
    <circle cx="38" cy="705" r="13" fill="${c.face}"/>
    <ellipse cx="-66" cy="738" rx="17" ry="10" fill="${c.cheek}" opacity="0.8"/>
    <ellipse cx="66" cy="738" rx="17" ry="10" fill="${c.cheek}" opacity="0.8"/>
    <path d="M-26 740 Q0 768 26 740" stroke="${c.face}" stroke-width="11" stroke-linecap="round" fill="none"/>
  </g>`;

module.exports = (scale = 1, theme = "light") => {
  const c = theme === "dark" ? dark : light;
  // Each friend's big leaf reaches inward; the tips meet in the middle.
  return `<g transform="translate(512 512) scale(${scale}) translate(-512 -540)">
    ${plant(c, 360, 4, 1)}
    ${plant(c, 664, -4, -1)}
  </g>`;
};
