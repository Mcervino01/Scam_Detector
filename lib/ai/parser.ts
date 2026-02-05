import { z } from "zod";

const IndicatorSchema = z.object({
  type: z.enum(["red_flag", "trust_signal"]),
  text: z.string(),
  weight: z.number().min(0).max(1),
});

const AnalysisResponseSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(["SAFE", "LOW_RISK", "SUSPICIOUS", "LIKELY_SCAM", "CONFIRMED_SCAM"]),
  confidence: z.number().min(0).max(1),
  scam_type: z.string().nullable(),
  scam_sub_type: z.string().nullable().optional(),
  indicators: z.array(IndicatorSchema),
  explanation: z.string(),
  recommendations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisResponseSchema>;

/**
 * Parse and validate the AI's JSON response.
 * Handles cases where the AI wraps JSON in markdown code blocks.
 */
export function parseAnalysisResponse(rawResponse: string): AnalysisResult {
  // Strip markdown code block wrappers if present
  let jsonStr = rawResponse.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails, return a safe fallback
    return {
      risk_score: 50,
      risk_level: "SUSPICIOUS",
      confidence: 0.3,
      scam_type: null,
      scam_sub_type: null,
      indicators: [
        { type: "red_flag", text: "Unable to parse analysis - treat with caution", weight: 0.5 },
      ],
      explanation:
        "The analysis could not be completed reliably. We recommend treating this content with caution and verifying through other means.",
      recommendations: [
        "Do not interact with the suspicious content until verified",
        "Contact the supposed sender through official channels to verify",
        "Report this content if you believe it is a scam",
      ],
    };
  }

  const result = AnalysisResponseSchema.safeParse(parsed);
  if (!result.success) {
    // Schema validation failed - return the parsed data with safe defaults
    const data = parsed as Record<string, unknown>;
    return {
      risk_score: typeof data.risk_score === "number" ? Math.min(100, Math.max(0, data.risk_score)) : 50,
      risk_level: "SUSPICIOUS",
      confidence: typeof data.confidence === "number" ? data.confidence : 0.5,
      scam_type: null,
      scam_sub_type: null,
      indicators: Array.isArray(data.indicators) ? [] : [],
      explanation: typeof data.explanation === "string" ? data.explanation : "Analysis completed with limited confidence.",
      recommendations: Array.isArray(data.recommendations)
        ? (data.recommendations as string[]).filter((r) => typeof r === "string")
        : ["Exercise caution with this content"],
    };
  }

  return result.data;
}
