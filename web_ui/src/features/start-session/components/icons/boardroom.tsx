function BoardroomSVG() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      {/* Window background */}
      <rect x="0" y="0" width="200" height="75" fill="#1e293b" />
      {/* Window panes */}
      {[10, 55, 100, 145].map((x) => (
        <rect
          key={x}
          x={x}
          y="5"
          width="40"
          height="65"
          rx="2"
          fill="#0f172a"
          opacity="0.5"
        />
      ))}
      {/* City skyline */}
      <rect x="15" y="25" width="12" height="45" fill="#334155" />
      <rect x="30" y="15" width="10" height="55" fill="#1e293b" />
      <rect x="60" y="20" width="15" height="50" fill="#334155" />
      <rect x="78" y="10" width="8" height="60" fill="#1e293b" />
      <rect x="110" y="30" width="18" height="40" fill="#334155" />
      <rect x="150" y="18" width="12" height="52" fill="#1e293b" />
      <rect x="165" y="28" width="20" height="42" fill="#334155" />
      {/* Floor */}
      <rect x="0" y="75" width="200" height="45" fill="#0f172a" />
      {/* Boardroom table */}
      <ellipse cx="100" cy="95" rx="75" ry="22" fill="#292524" />
      <ellipse cx="100" cy="93" rx="75" ry="22" fill="#44403c" />
      {/* Chairs around table */}
      {[20, 50, 80, 120, 150, 178].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="82" rx="8" ry="8" fill="#1c1917" />
        </g>
      ))}
      {/* Laptop on table */}
      <rect x="88" y="87" width="24" height="14" rx="2" fill="#1c1917" />
      <rect
        x="89"
        y="88"
        width="22"
        height="11"
        rx="1"
        fill="#0ea5e9"
        opacity="0.3"
      />
    </svg>
  );
}
export default BoardroomSVG;
