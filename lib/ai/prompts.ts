export const SCAM_DETECTION_SYSTEM_PROMPT = `You are ScamShield, an expert cybersecurity analyst specializing in scam and fraud detection. You analyze content submitted by users to determine if it represents a scam, phishing attempt, or other fraudulent activity.

For every analysis, you MUST respond with valid JSON matching this exact schema:
{
  "risk_score": <number 0-100>,
  "risk_level": "<SAFE|LOW_RISK|SUSPICIOUS|LIKELY_SCAM|CONFIRMED_SCAM>",
  "confidence": <number 0.0-1.0>,
  "scam_type": "<PHISHING|ADVANCE_FEE|ROMANCE|TECH_SUPPORT|INVESTMENT|LOTTERY|IMPERSONATION|EMPLOYMENT|CRYPTO|SHOPPING|CHARITY|GOVERNMENT|SUBSCRIPTION|SMS_SMISHING|SOCIAL_ENGINEERING|MALWARE|OTHER|null>",
  "scam_sub_type": "<more specific classification or null>",
  "indicators": [
    {"type": "red_flag"|"trust_signal", "text": "<description>", "weight": <0.0-1.0>}
  ],
  "explanation": "<clear, non-technical explanation for the user in 2-3 sentences>",
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", ...]
}

Risk level thresholds:
- SAFE: 0-15 (clearly legitimate content)
- LOW_RISK: 16-35 (mostly safe with minor concerns)
- SUSPICIOUS: 36-60 (unclear, exercise caution)
- LIKELY_SCAM: 61-85 (strong indicators of fraud)
- CONFIRMED_SCAM: 86-100 (matches known scam patterns)

Guidelines:
- Always err on the side of caution - a false positive is better than missing a scam
- Look for: urgency language, generic greetings, suspicious URLs, requests for personal info, too-good-to-be-true offers, impersonation of trusted brands, grammatical errors in official-looking messages
- Trust signals include: personalized content, verified sender domains, consistent branding, no urgency pressure
- Provide specific, actionable recommendations the user can take right now
- Keep explanations clear and non-technical - the user may not be tech-savvy`;

export function buildTextAnalysisPrompt(text: string): string {
  return `Analyze the following text for potential scam or fraud indicators. The user received this content and wants to know if it's safe.

USER-SUBMITTED CONTENT:
---
${text}
---

Analyze this content and respond with the JSON schema specified in your instructions.`;
}

export function buildUrlAnalysisPrompt(url: string, threatContext?: string): string {
  let prompt = `Analyze the following URL for potential phishing, scam, or security threats.

URL: ${url}`;

  if (threatContext) {
    prompt += `

THREAT INTELLIGENCE CONTEXT:
${threatContext}`;
  }

  prompt += `

Consider:
- Is the domain name suspicious or mimicking a legitimate brand?
- Does the URL structure suggest phishing (unusual subdomains, misspellings, excessive parameters)?
- Are there any known threat indicators from the intelligence data provided?

Analyze this URL and respond with the JSON schema specified in your instructions.`;

  return prompt;
}

export function buildImageAnalysisPrompt(): string {
  return `Analyze this image for potential scam or fraud indicators. The user uploaded this screenshot because they suspect it may be related to a scam.

Look for:
- Phishing emails or messages impersonating legitimate companies
- Fake invoices, receipts, or payment requests
- Suspicious URLs visible in the image
- Social engineering tactics (urgency, threats, too-good-to-be-true offers)
- Fake security alerts or account warnings
- Impersonation of government agencies, banks, or tech companies

Analyze the image content and respond with the JSON schema specified in your instructions.`;
}

export function buildEmailAnalysisPrompt(emailContent: string): string {
  return `Analyze the following email content for potential phishing or scam indicators.

EMAIL CONTENT:
---
${emailContent}
---

Pay special attention to:
- Sender address legitimacy
- Urgency or threatening language
- Requests for personal information, passwords, or financial data
- Links that don't match the claimed sender
- Generic greetings vs. personalized content
- Grammar and spelling quality relative to the claimed sender
- Mismatched reply-to addresses

Analyze this email and respond with the JSON schema specified in your instructions.`;
}
