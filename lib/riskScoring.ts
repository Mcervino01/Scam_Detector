import { clamp, scoreToRiskLevel } from "./utils";
import type { RiskLevel } from "@prisma/client";

type RiskScoringInput = {
  aiScore: number;
  aiConfidence: number;
  threatIntel?: {
    safeBrowsingFlagged: boolean;
    virusTotalPositives: number;
  };
  urlAnalysis?: {
    suspicious: string[];
  };
};

type RiskScoringResult = {
  score: number;
  level: RiskLevel;
  breakdown: {
    aiBaseScore: number;
    threatAdjustment: number;
    urlAdjustment: number;
    confidenceWeight: number;
    finalScore: number;
  };
};

/**
 * Calculate the final risk score as a weighted combination of:
 * - AI analysis base score (60% weight)
 * - Threat intelligence adjustments (40% weight, scaled by AI confidence)
 */
export function calculateRiskScore(input: RiskScoringInput): RiskScoringResult {
  const { aiScore, aiConfidence, threatIntel, urlAnalysis } = input;

  let threatAdjustment = 0;
  let urlAdjustment = 0;

  // Threat intelligence adjustments
  if (threatIntel) {
    if (threatIntel.safeBrowsingFlagged) {
      threatAdjustment += 25;
    }
    if (threatIntel.virusTotalPositives > 0) {
      threatAdjustment += Math.min(threatIntel.virusTotalPositives * 3, 30);
    }
  }

  // URL analysis adjustments
  if (urlAnalysis && urlAnalysis.suspicious.length > 0) {
    urlAdjustment += Math.min(urlAnalysis.suspicious.length * 5, 20);
  }

  // Weight adjustments by AI confidence
  const totalAdjustment = (threatAdjustment + urlAdjustment) * aiConfidence;

  // Final weighted score: 60% AI + 40% adjustments
  const finalScore = clamp(
    Math.round(aiScore * 0.6 + totalAdjustment * 0.4 + aiScore * 0.4),
    0,
    100
  );

  // If threat databases flag it, enforce a minimum score
  if (threatIntel?.safeBrowsingFlagged && finalScore < 60) {
    return {
      score: 60,
      level: scoreToRiskLevel(60),
      breakdown: {
        aiBaseScore: aiScore,
        threatAdjustment,
        urlAdjustment,
        confidenceWeight: aiConfidence,
        finalScore: 60,
      },
    };
  }

  return {
    score: finalScore,
    level: scoreToRiskLevel(finalScore),
    breakdown: {
      aiBaseScore: aiScore,
      threatAdjustment,
      urlAdjustment,
      confidenceWeight: aiConfidence,
      finalScore,
    },
  };
}
