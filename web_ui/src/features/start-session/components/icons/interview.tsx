function InterviewSVG() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      {/* Background wall */}
      <rect x="0" y="0" width="200" height="120" fill="#0c1931" />
      {/* Corporate logo/frame on wall */}
      <rect x="70" y="8" width="60" height="40" rx="3" fill="#0f2040" />
      <rect x="73" y="11" width="54" height="34" rx="2" fill="#0c1931" />
      <text
        x="100"
        y="32"
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="10"
        fontWeight="bold"
      >
        PANEL
      </text>
      {/* Table */}
      <rect x="0" y="78" width="200" height="42" fill="#0f172a" />
      <rect x="0" y="76" width="200" height="6" rx="2" fill="#1e3a5f" />
      {/* 3 interviewer silhouettes */}
      {[48, 100, 152].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="64" rx="12" ry="12" fill="#1e3a5f" />
          <rect
            x={x - 14}
            y="75"
            width="28"
            height="10"
            rx="2"
            fill="#1e3a5f"
          />
          {/* Papers */}
          <rect
            x={x - 10}
            y="82"
            width="20"
            height="14"
            rx="1"
            fill="#162235"
          />
        </g>
      ))}
      {/* Candidate side */}
      <ellipse cx="100" cy="110" rx="10" ry="10" fill="#0e3a5c" />
      {/* Water glasses */}
      {[45, 100, 155].map((x) => (
        <rect
          key={x}
          x={x - 3}
          y="80"
          width="6"
          height="10"
          rx="1"
          fill="#38bdf8"
          opacity="0.3"
        />
      ))}
      {/* Soft light effect */}
      <ellipse cx="100" cy="50" rx="80" ry="50" fill="#38bdf8" opacity="0.03" />
    </svg>
  );
}
export default InterviewSVG;
