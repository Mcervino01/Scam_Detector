export const RISK_THRESHOLDS = {
  SAFE: 15,
  LOW_RISK: 35,
  SUSPICIOUS: 60,
  LIKELY_SCAM: 85,
  // Anything above 85 is CONFIRMED_SCAM
} as const;

export const RISK_LEVEL_COLORS = {
  SAFE: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", dot: "bg-green-500" },
  LOW_RISK: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", dot: "bg-blue-500" },
  SUSPICIOUS: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", dot: "bg-yellow-500" },
  LIKELY_SCAM: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", dot: "bg-orange-500" },
  CONFIRMED_SCAM: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", dot: "bg-red-500" },
} as const;

export const RISK_LEVEL_LABELS = {
  SAFE: "Safe",
  LOW_RISK: "Low Risk",
  SUSPICIOUS: "Suspicious",
  LIKELY_SCAM: "Likely Scam",
  CONFIRMED_SCAM: "Confirmed Scam",
} as const;

export const SCAM_TYPE_LABELS: Record<string, string> = {
  PHISHING: "Phishing",
  ADVANCE_FEE: "Advance Fee Fraud",
  ROMANCE: "Romance Scam",
  TECH_SUPPORT: "Tech Support Scam",
  INVESTMENT: "Investment Scam",
  LOTTERY: "Lottery/Prize Scam",
  IMPERSONATION: "Impersonation",
  EMPLOYMENT: "Employment Scam",
  CRYPTO: "Crypto Scam",
  SHOPPING: "Shopping Scam",
  CHARITY: "Charity Scam",
  GOVERNMENT: "Government Impersonation",
  SUBSCRIPTION: "Subscription Scam",
  SMS_SMISHING: "SMS Smishing",
  SOCIAL_ENGINEERING: "Social Engineering",
  MALWARE: "Malware Distribution",
  OTHER: "Other",
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
