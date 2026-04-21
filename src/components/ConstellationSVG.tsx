"use client";

import { useEffect, useRef } from "react";

type Node = { id: string; label: string; x: number; y: number; labelAbove?: boolean };

const NODES: Node[] = [
  { id: "eng", label: "ENGINEERING", x: 120, y: 110, labelAbove: true },
  { id: "sls", label: "SALES", x: 350, y: 70, labelAbove: true },
  { id: "sup", label: "SUPPORT", x: 580, y: 130, labelAbove: true },
  { id: "mkt", label: "MARKETING", x: 800, y: 90, labelAbove: true },
  { id: "ops", label: "OPERATIONS", x: 230, y: 260 },
  { id: "fin", label: "FINANCE", x: 470, y: 290 },
  { id: "leg", label: "LEGAL", x: 710, y: 250 },
  { id: "hr",  label: "HR",        x: 140, y: 420 },
  { id: "prd", label: "PRODUCT",   x: 660, y: 420 },
];

const EDGES: [string, string][] = [
  ["eng", "sls"], ["sls", "sup"], ["sup", "mkt"],
  ["eng", "ops"], ["sls", "fin"], ["sup", "fin"], ["mkt", "leg"],
  ["ops", "fin"], ["fin", "leg"],
  ["ops", "hr"], ["hr", "prd"], ["fin", "prd"], ["leg", "prd"],
  ["eng", "hr"], ["mkt", "prd"],
];

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export default function ConstellationSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    if (!svg) return;

    const lines = svg.querySelectorAll<SVGLineElement>("line[data-edge]");

    if (reduced) {
      lines.forEach((l) => {
        l.style.strokeDashoffset = "0";
      });
      return;
    }

    lines.forEach((line, idx) => {
      const length = line.getTotalLength();
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
      line.style.transition = `stroke-dashoffset 1500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 90}ms`;
      requestAnimationFrame(() => {
        line.style.strokeDashoffset = "0";
      });
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 920 500"
      className="w-full h-auto max-w-4xl mx-auto"
      role="img"
      aria-label="Constellation of 9 AI departments"
    >
      <g stroke="#FF6B35" strokeOpacity="0.3" strokeWidth="1">
        {EDGES.map(([a, b], i) => {
          const A = nodeById(a);
          const B = nodeById(b);
          return (
            <line
              key={`e-${i}`}
              data-edge
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
            />
          );
        })}
      </g>

      {NODES.map((n, i) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r="6"
            fill="#FF6B35"
            className="node-pulse"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
          <text
            x={n.x}
            y={n.labelAbove ? n.y - 16 : n.y + 24}
            textAnchor="middle"
            fill="#F5F1EA"
            fontFamily="var(--font-sans), Inter, sans-serif"
            fontSize="10"
            letterSpacing="1.5"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
