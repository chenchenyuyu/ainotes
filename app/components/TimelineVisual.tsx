import type { TimelineEvent } from "../../src/content/fundamentals.js";

type VisualKind = TimelineEvent["visual"];

const titleByVisual: Record<VisualKind, string> = {
  transformer: "Encoder / Attention",
  tools: "Model → Tools",
  "react-loop": "Think → Act → Observe",
  harness: "Guardrails",
  mcp: "MCP + Agents",
};

export function TimelineVisual({ kind, alt }: { kind: VisualKind; alt: string }) {
  return (
    <figure className="timeline-visual" aria-label={alt}>
      <svg viewBox="0 0 360 200" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`g-${kind}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ece8ff" />
            <stop offset="100%" stopColor="#dfe8ff" />
          </linearGradient>
        </defs>
        <rect width="360" height="200" rx="18" fill={`url(#g-${kind})`} />

        {kind === "transformer" && (
          <>
            <rect x="36" y="48" width="88" height="104" rx="12" fill="#101218" />
            <rect x="136" y="48" width="88" height="104" rx="12" fill="#2a3140" />
            <rect x="236" y="48" width="88" height="104" rx="12" fill="#705cf6" />
            <text x="80" y="108" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
              Input
            </text>
            <text x="180" y="108" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
              Attention
            </text>
            <text x="280" y="108" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
              Output
            </text>
            <path d="M124 100 H136" stroke="#68707d" strokeWidth="3" />
            <path d="M224 100 H236" stroke="#68707d" strokeWidth="3" />
          </>
        )}

        {kind === "tools" && (
          <>
            <rect x="40" y="70" width="110" height="60" rx="14" fill="#101218" />
            <text x="95" y="106" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
              LLM
            </text>
            <path d="M150 100 H190" stroke="#705cf6" strokeWidth="3" markerEnd="url(#arrow)" />
            <rect x="200" y="36" width="120" height="40" rx="10" fill="#fff" stroke="#c5cad3" />
            <rect x="200" y="86" width="120" height="40" rx="10" fill="#fff" stroke="#c5cad3" />
            <rect x="200" y="136" width="120" height="40" rx="10" fill="#fff" stroke="#c5cad3" />
            <text x="260" y="61" textAnchor="middle" fill="#161a1f" fontSize="12">
              Search
            </text>
            <text x="260" y="111" textAnchor="middle" fill="#161a1f" fontSize="12">
              Calculator
            </text>
            <text x="260" y="161" textAnchor="middle" fill="#161a1f" fontSize="12">
              Database
            </text>
          </>
        )}

        {kind === "react-loop" && (
          <>
            <circle cx="180" cy="100" r="34" fill="#101218" />
            <text x="180" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
              Agent
            </text>
            <rect x="36" y="34" width="84" height="36" rx="10" fill="#fff" stroke="#c5cad3" />
            <rect x="240" y="34" width="84" height="36" rx="10" fill="#705cf6" />
            <rect x="138" y="150" width="84" height="36" rx="10" fill="#2a3140" />
            <text x="78" y="57" textAnchor="middle" fill="#161a1f" fontSize="12">
              Thought
            </text>
            <text x="282" y="57" textAnchor="middle" fill="#fff" fontSize="12">
              Act
            </text>
            <text x="180" y="173" textAnchor="middle" fill="#fff" fontSize="12">
              Observe
            </text>
            <path
              d="M120 52 C150 20, 210 20, 240 52"
              fill="none"
              stroke="#8b91a0"
              strokeWidth="2"
            />
            <path
              d="M282 70 C310 110, 250 150, 222 160"
              fill="none"
              stroke="#8b91a0"
              strokeWidth="2"
            />
            <path
              d="M138 160 C90 140, 70 90, 78 70"
              fill="none"
              stroke="#8b91a0"
              strokeWidth="2"
            />
          </>
        )}

        {kind === "harness" && (
          <>
            <rect x="48" y="50" width="100" height="100" rx="14" fill="#101218" />
            <text x="98" y="108" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
              Planner
            </text>
            <rect x="210" y="36" width="110" height="42" rx="12" fill="#705cf6" />
            <rect x="210" y="90" width="110" height="42" rx="12" fill="#2a3140" />
            <rect x="210" y="144" width="110" height="36" rx="12" fill="#fff" stroke="#c5cad3" />
            <text x="265" y="62" textAnchor="middle" fill="#fff" fontSize="12">
              Reviewer
            </text>
            <text x="265" y="116" textAnchor="middle" fill="#fff" fontSize="12">
              Budget
            </text>
            <text x="265" y="167" textAnchor="middle" fill="#161a1f" fontSize="12">
              Human Approve
            </text>
            <path d="M148 100 H210" stroke="#8b91a0" strokeWidth="3" />
          </>
        )}

        {kind === "mcp" && (
          <>
            <rect x="130" y="78" width="100" height="44" rx="12" fill="#705cf6" />
            <text x="180" y="105" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
              MCP
            </text>
            <rect x="28" y="36" width="84" height="36" rx="10" fill="#101218" />
            <rect x="28" y="128" width="84" height="36" rx="10" fill="#101218" />
            <rect x="248" y="36" width="84" height="36" rx="10" fill="#fff" stroke="#c5cad3" />
            <rect x="248" y="88" width="84" height="36" rx="10" fill="#fff" stroke="#c5cad3" />
            <rect x="248" y="140" width="84" height="36" rx="10" fill="#fff" stroke="#c5cad3" />
            <text x="70" y="59" textAnchor="middle" fill="#fff" fontSize="11">
              Agent A
            </text>
            <text x="70" y="151" textAnchor="middle" fill="#fff" fontSize="11">
              Agent B
            </text>
            <text x="290" y="59" textAnchor="middle" fill="#161a1f" fontSize="11">
              Notes
            </text>
            <text x="290" y="111" textAnchor="middle" fill="#161a1f" fontSize="11">
              Browser
            </text>
            <text x="290" y="163" textAnchor="middle" fill="#161a1f" fontSize="11">
              DB
            </text>
            <path d="M112 54 H130" stroke="#8b91a0" strokeWidth="2" />
            <path d="M112 146 H130" stroke="#8b91a0" strokeWidth="2" />
            <path d="M230 100 H248" stroke="#8b91a0" strokeWidth="2" />
            <path d="M230 88 H248" stroke="#8b91a0" strokeWidth="2" />
            <path d="M230 112 H248" stroke="#8b91a0" strokeWidth="2" />
          </>
        )}
      </svg>
      <figcaption>{titleByVisual[kind]}</figcaption>
    </figure>
  );
}
