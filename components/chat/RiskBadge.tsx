"use client";

import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS } from "@/lib/constants";

type RiskLevel = keyof typeof RISK_LEVEL_COLORS;

export function RiskBadge({
  riskLevel,
  riskScore,
  size = "md",
}: {
  riskLevel: RiskLevel;
  riskScore: number;
  size?: "sm" | "md" | "lg";
}) {
  const colors = RISK_LEVEL_COLORS[riskLevel] || RISK_LEVEL_COLORS.SUSPICIOUS;
  const label = RISK_LEVEL_LABELS[riskLevel] || riskLevel;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${colors.border} border ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {label} ({riskScore})
    </span>
  );
}

export function RiskScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 100) * circumference;
  const color =
    score <= 15
      ? "#22c55e"
      : score <= 35
        ? "#3b82f6"
        : score <= 60
          ? "#eab308"
          : score <= 85
            ? "#f97316"
            : "#ef4444";

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}
