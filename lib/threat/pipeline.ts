import { analyzeWithClaude, type AnalyzeInput, type ClaudeAnalysisResult } from "../ai/claude";
import { checkSafeBrowsing } from "./safeBrowsing";
import { checkVirusTotal } from "./virusTotal";
import { analyzeUrl } from "./urlAnalyzer";
import { calculateRiskScore } from "../riskScoring";
import { hashInput, isUrl } from "../utils";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import type { InputType, RiskLevel, ScamType, AnalysisStatus } from "@prisma/client";

export type PipelineInput = {
  content: string;
  inputType: InputType;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  conversationId: string;
};

export type PipelineResult = {
  analysisId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  scamType: ScamType | null;
  explanation: string;
  recommendations: string[];
  indicators: Array<{ type: string; text: string; weight: number }>;
  processingTimeMs: number;
  cached: boolean;
};

/**
 * Main analysis pipeline. Orchestrates:
 * 1. Cache check (same input hash = return cached result)
 * 2. Threat intelligence lookups (parallel, for URLs)
 * 3. AI analysis (with threat context)
 * 4. Risk score calculation (weighted combination)
 * 5. Store result in database
 */
export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineResult> {
  const startTime = Date.now();
  const inputHash = hashInput(input.content);

  // 1. Check cache for recent identical analysis
  const cached = await prisma.analysis.findFirst({
    where: {
      inputHash,
      status: "COMPLETED",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24hr cache
    },
    orderBy: { createdAt: "desc" },
  });

  if (cached) {
    // Create a new analysis record linked to this conversation but with cached data
    const analysis = await prisma.analysis.create({
      data: {
        conversationId: input.conversationId,
        inputType: input.inputType,
        inputContent: input.content,
        inputHash,
        riskScore: cached.riskScore,
        riskLevel: cached.riskLevel,
        confidence: cached.confidence,
        scamType: cached.scamType,
        scamSubType: cached.scamSubType,
        aiAnalysis: cached.aiAnalysis as Prisma.InputJsonValue,
        threatIntel: cached.threatIntel as Prisma.InputJsonValue ?? Prisma.JsonNull,
        urlAnalysis: cached.urlAnalysis as Prisma.InputJsonValue ?? Prisma.JsonNull,
        indicators: cached.indicators as Prisma.InputJsonValue,
        recommendation: cached.recommendation,
        actions: cached.actions as Prisma.InputJsonValue,
        processingTimeMs: Date.now() - startTime,
        aiModelUsed: cached.aiModelUsed,
        aiTokensUsed: 0, // No AI cost for cached results
        status: "CACHED" as AnalysisStatus,
        completedAt: new Date(),
      },
    });

    return {
      analysisId: analysis.id,
      riskScore: cached.riskScore,
      riskLevel: cached.riskLevel,
      confidence: cached.confidence,
      scamType: cached.scamType,
      explanation: cached.recommendation,
      recommendations: (cached.actions as string[]) || [],
      indicators: (cached.indicators as Array<{ type: string; text: string; weight: number }>) || [],
      processingTimeMs: Date.now() - startTime,
      cached: true,
    };
  }

  // 2. Create a pending analysis record
  const pendingAnalysis = await prisma.analysis.create({
    data: {
      conversationId: input.conversationId,
      inputType: input.inputType,
      inputContent: input.content,
      inputHash,
      riskScore: 0,
      riskLevel: "SAFE",
      confidence: 0,
      aiAnalysis: {},
      indicators: [],
      recommendation: "",
      actions: [],
      status: "PROCESSING" as AnalysisStatus,
    },
  });

  try {
    // 3. Run threat intelligence (parallel, for URLs)
    let threatIntel: Record<string, unknown> | null = null;
    let urlAnalysis: Record<string, unknown> | null = null;
    let threatContext = "";

    if (input.inputType === "URL" || isUrl(input.content)) {
      const url = input.content.trim();
      const [safeBrowsingResult, virusTotalResult, urlAnalysisResult] = await Promise.all([
        checkSafeBrowsing(url),
        checkVirusTotal(url),
        analyzeUrl(url),
      ]);

      threatIntel = {
        safeBrowsing: safeBrowsingResult,
        virusTotal: virusTotalResult,
      };
      urlAnalysis = urlAnalysisResult as unknown as Record<string, unknown>;

      // Build threat context string for AI
      const contextParts: string[] = [];
      if (safeBrowsingResult.isFlagged) {
        contextParts.push(`- Google Safe Browsing: FLAGGED as ${safeBrowsingResult.threats.join(", ")}`);
      } else {
        contextParts.push("- Google Safe Browsing: Not flagged");
      }
      if (virusTotalResult.positives > 0) {
        contextParts.push(
          `- VirusTotal: ${virusTotalResult.positives}/${virusTotalResult.total} engines detected threats`
        );
      } else {
        contextParts.push(`- VirusTotal: Clean (0/${virusTotalResult.total} detections)`);
      }
      if (urlAnalysisResult.suspicious.length > 0) {
        contextParts.push(`- URL Analysis concerns: ${urlAnalysisResult.suspicious.join("; ")}`);
      }
      threatContext = contextParts.join("\n");
    }

    // 4. AI Analysis
    let claudeInput: AnalyzeInput;

    if (input.inputType === "IMAGE" && input.imageBase64 && input.imageMediaType) {
      claudeInput = {
        type: "image",
        imageBase64: input.imageBase64,
        mediaType: input.imageMediaType,
      };
    } else if (input.inputType === "URL" || isUrl(input.content)) {
      claudeInput = {
        type: "url",
        url: input.content.trim(),
        threatContext: threatContext || undefined,
      };
    } else if (input.inputType === "EMAIL") {
      claudeInput = {
        type: "email",
        content: input.content,
      };
    } else {
      claudeInput = {
        type: "text",
        content: input.content,
      };
    }

    const aiResult = await analyzeWithClaude(claudeInput);

    // 5. Calculate final risk score
    const finalScore = calculateRiskScore({
      aiScore: aiResult.risk_score,
      aiConfidence: aiResult.confidence,
      threatIntel: threatIntel
        ? {
            safeBrowsingFlagged: (threatIntel.safeBrowsing as { isFlagged: boolean })?.isFlagged || false,
            virusTotalPositives: (threatIntel.virusTotal as { positives: number })?.positives || 0,
          }
        : undefined,
      urlAnalysis: urlAnalysis
        ? {
            suspicious: ((urlAnalysis as { suspicious?: string[] }).suspicious || []),
          }
        : undefined,
    });

    // 6. Update analysis record
    const updatedAnalysis = await prisma.analysis.update({
      where: { id: pendingAnalysis.id },
      data: {
        riskScore: finalScore.score,
        riskLevel: finalScore.level,
        confidence: aiResult.confidence,
        scamType: (aiResult.scam_type as ScamType) || null,
        scamSubType: aiResult.scam_sub_type || null,
        aiAnalysis: JSON.parse(JSON.stringify(aiResult)) as Prisma.InputJsonValue,
        threatIntel: threatIntel ? (JSON.parse(JSON.stringify(threatIntel)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        urlAnalysis: urlAnalysis ? (JSON.parse(JSON.stringify(urlAnalysis)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        indicators: JSON.parse(JSON.stringify(aiResult.indicators)) as Prisma.InputJsonValue,
        recommendation: aiResult.explanation,
        actions: aiResult.recommendations as unknown as Prisma.InputJsonValue,
        processingTimeMs: Date.now() - startTime,
        aiModelUsed: aiResult.modelUsed,
        aiTokensUsed: aiResult.tokensUsed,
        status: "COMPLETED" as AnalysisStatus,
        completedAt: new Date(),
      },
    });

    return {
      analysisId: updatedAnalysis.id,
      riskScore: finalScore.score,
      riskLevel: finalScore.level,
      confidence: aiResult.confidence,
      scamType: (aiResult.scam_type as ScamType) || null,
      explanation: aiResult.explanation,
      recommendations: aiResult.recommendations,
      indicators: aiResult.indicators,
      processingTimeMs: Date.now() - startTime,
      cached: false,
    };
  } catch (error) {
    // Update analysis as failed
    await prisma.analysis.update({
      where: { id: pendingAnalysis.id },
      data: { status: "FAILED" as AnalysisStatus },
    });
    throw error;
  }
}
