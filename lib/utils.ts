import crypto from "crypto";
import { RISK_THRESHOLDS } from "./constants";
import type { RiskLevel } from "@prisma/client";

/**
 * Generate a SHA-256 hash of the input for deduplication/caching
 */
export function hashInput(input: string): string {
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

/**
 * Convert a risk score (0-100) to a RiskLevel enum value
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.SAFE) return "SAFE";
  if (score <= RISK_THRESHOLDS.LOW_RISK) return "LOW_RISK";
  if (score <= RISK_THRESHOLDS.SUSPICIOUS) return "SUSPICIOUS";
  if (score <= RISK_THRESHOLDS.LIKELY_SCAM) return "LIKELY_SCAM";
  return "CONFIRMED_SCAM";
}

/**
 * Defang a URL for safe display (prevents accidental clicks)
 * e.g., https://evil.com -> hxxps://evil[.]com
 */
export function defangUrl(url: string): string {
  return url
    .replace(/^https?/i, (match) => match.replace(/t/i, "x").replace(/T/i, "X"))
    .replace(/\./g, "[.]");
}

/**
 * Generate a cryptographically random access token
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format milliseconds to a human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) || [];
}

/**
 * Detect if text input is primarily a URL
 */
export function isUrl(text: string): boolean {
  const trimmed = text.trim();
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}
