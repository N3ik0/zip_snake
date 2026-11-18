/** Shared SVG gradients, referenced by id from the board pieces. */
export function BoardDefs() {
  return (
    <defs>
      <linearGradient id="frame-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9a6038" />
        <stop offset="1" stopColor="#6a3d22" />
      </linearGradient>
      <linearGradient id="tile-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d3ec98" />
        <stop offset="1" stopColor="#bfe07c" />
      </linearGradient>
      <linearGradient id="tile-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c2e283" />
        <stop offset="1" stopColor="#abd46a" />
      </linearGradient>
      <radialGradient id="apple" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ff9aa0" />
        <stop offset="0.45" stopColor="#ff4d5e" />
        <stop offset="1" stopColor="#c0243a" />
      </radialGradient>
      <radialGradient id="snake-head" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#3fd09a" />
        <stop offset="1" stopColor="#0a7a54" />
      </radialGradient>
    </defs>
  );
}
