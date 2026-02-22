const StageSVG = () => {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      {/* Curtains */}
      <rect x="0" y="0" width="38" height="120" fill="#4c1d95" opacity="0.9" />
      <rect
        x="162"
        y="0"
        width="38"
        height="120"
        fill="#4c1d95"
        opacity="0.9"
      />
      {/* Stage floor */}
      <rect x="0" y="88" width="200" height="32" fill="#1e1b4b" opacity="0.7" />
      {/* Floor boards */}
      {[0, 40, 80, 120, 160].map((x) => (
        <line
          key={x}
          x1={x}
          y1="88"
          x2={x}
          y2="120"
          stroke="#312e81"
          strokeWidth="1"
        />
      ))}
      {/* Spotlight beams */}
      <polygon points="45,0 75,0 65,88 35,88" fill="white" opacity="0.07" />
      <polygon points="90,0 120,0 115,88 85,88" fill="white" opacity="0.09" />
      <polygon points="135,0 165,0 165,88 135,88" fill="white" opacity="0.07" />
      {/* Spotlight circles top */}
      <ellipse cx="60" cy="6" rx="14" ry="6" fill="#fbbf24" opacity="0.9" />
      <ellipse cx="100" cy="4" rx="16" ry="7" fill="#fcd34d" opacity="0.95" />
      <ellipse cx="140" cy="6" rx="14" ry="6" fill="#fbbf24" opacity="0.9" />
      {/* Speaker silhouette */}
      <ellipse cx="100" cy="70" rx="8" ry="8" fill="#1e1b4b" />
      <rect x="95" y="78" width="10" height="18" rx="2" fill="#1e1b4b" />
      {/* Audience silhouettes */}
      {[20, 45, 70, 130, 155, 178].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="108" rx="7" ry="7" fill="#312e81" opacity="0.7" />
          <rect
            x={x - 5}
            y="113"
            width="10"
            height="8"
            rx="1"
            fill="#312e81"
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
};
export default StageSVG;
