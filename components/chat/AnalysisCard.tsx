"use client";

import { useState } from "react";
import { RiskBadge, RiskScoreCircle } from "./RiskBadge";
import { SCAM_TYPE_LABELS } from "@/lib/constants";

type Indicator = {
  type: "red_flag" | "trust_signal";
  text: string;
  weight: number;
};

type AnalysisData = {
  id: string;
  riskScore: number;
  riskLevel: string;
  confidence: number;
  scamType: string | null;
  explanation: string;
  recommendations: string[];
  indicators: Indicator[];
  processingTimeMs: number;
  cached?: boolean;
};

export function AnalysisCard({
  analysis,
  onFeedback,
}: {
  analysis: AnalysisData;
  onFeedback?: (analysisId: string, feedback: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const redFlags = analysis.indicators.filter((i) => i.type === "red_flag");
  const trustSignals = analysis.indicators.filter((i) => i.type === "trust_signal");

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-2">
      {/* Summary Header */}
      <div className="p-4 flex items-center gap-4">
        <RiskScoreCircle score={analysis.riskScore} />
        <div className="flex-1 min-w-0">
          <RiskBadge
            riskLevel={analysis.riskLevel as "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "LIKELY_SCAM" | "CONFIRMED_SCAM"}
            riskScore={analysis.riskScore}
            size="md"
          />
          {analysis.scamType && (
            <p className="text-sm text-gray-500 mt-1">
              Type: {SCAM_TYPE_LABELS[analysis.scamType] || analysis.scamType}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Confidence: {Math.round(analysis.confidence * 100)}%
            {analysis.cached && " (cached)"}
            {analysis.processingTimeMs > 0 && ` \u00B7 ${(analysis.processingTimeMs / 1000).toFixed(1)}s`}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium shrink-0"
        >
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Indicators */}
          {redFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Red Flags</h4>
              <ul className="space-y-1">
                {redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5 shrink-0">&#9888;</span>
                    <span>{flag.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {trustSignals.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">Trust Signals</h4>
              <ul className="space-y-1">
                {trustSignals.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                    <span>{signal.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          {onFeedback && !feedbackSent && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Was this analysis helpful?</p>
              <div className="flex gap-2">
                {[
                  { label: "Helpful", value: "HELPFUL" },
                  { label: "Not helpful", value: "NOT_HELPFUL" },
                  { label: "False positive", value: "FALSE_POSITIVE" },
                  { label: "Missed scam", value: "FALSE_NEGATIVE" },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => {
                      onFeedback(analysis.id, btn.value);
                      setFeedbackSent(true);
                    }}
                    className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {feedbackSent && (
            <p className="text-xs text-green-600 pt-2 border-t border-gray-100">
              Thanks for your feedback!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
