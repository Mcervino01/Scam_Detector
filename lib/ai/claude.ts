import Anthropic from "@anthropic-ai/sdk";
import {
  SCAM_DETECTION_SYSTEM_PROMPT,
  buildTextAnalysisPrompt,
  buildUrlAnalysisPrompt,
  buildImageAnalysisPrompt,
  buildEmailAnalysisPrompt,
} from "./prompts";
import { parseAnalysisResponse, type AnalysisResult } from "./parser";

const MODEL = "claude-sonnet-4-5-20250929";

function getClient() {
  // Use SCAMSHIELD_ANTHROPIC_KEY first, fall back to ANTHROPIC_API_KEY
  // (ANTHROPIC_API_KEY may be overridden by Claude Code's own env)
  const apiKey = process.env.SCAMSHIELD_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not set. Set SCAMSHIELD_ANTHROPIC_KEY or ANTHROPIC_API_KEY in .env.local"
    );
  }
  return new Anthropic({ apiKey });
}

export type AnalyzeTextInput = {
  type: "text";
  content: string;
};

export type AnalyzeUrlInput = {
  type: "url";
  url: string;
  threatContext?: string;
};

export type AnalyzeImageInput = {
  type: "image";
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  extractedText?: string;
};

export type AnalyzeEmailInput = {
  type: "email";
  content: string;
};

export type AnalyzeInput = AnalyzeTextInput | AnalyzeUrlInput | AnalyzeImageInput | AnalyzeEmailInput;

export type ClaudeAnalysisResult = AnalysisResult & {
  modelUsed: string;
  tokensUsed: number;
  processingTimeMs: number;
};

export async function analyzeWithClaude(input: AnalyzeInput): Promise<ClaudeAnalysisResult> {
  const startTime = Date.now();

  let userContent: Anthropic.Messages.ContentBlockParam[];

  switch (input.type) {
    case "text":
      userContent = [{ type: "text", text: buildTextAnalysisPrompt(input.content) }];
      break;

    case "url":
      userContent = [{ type: "text", text: buildUrlAnalysisPrompt(input.url, input.threatContext) }];
      break;

    case "image":
      userContent = [
        {
          type: "image",
          source: { type: "base64", media_type: input.mediaType, data: input.imageBase64 },
        },
        { type: "text", text: buildImageAnalysisPrompt() },
      ];
      if (input.extractedText) {
        userContent.push({
          type: "text",
          text: `\nOCR-EXTRACTED TEXT FROM IMAGE:\n---\n${input.extractedText}\n---`,
        });
      }
      break;

    case "email":
      userContent = [{ type: "text", text: buildEmailAnalysisPrompt(input.content) }];
      break;
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SCAM_DETECTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const processingTimeMs = Date.now() - startTime;

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = parseAnalysisResponse(textBlock.text);

  return {
    ...parsed,
    modelUsed: MODEL,
    tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    processingTimeMs,
  };
}
