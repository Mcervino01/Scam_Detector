type UrlAnalysisResult = {
  isValid: boolean;
  domain: string;
  protocol: string;
  hasSSL: boolean;
  redirectCount: number;
  finalUrl: string;
  responseCode?: number;
  serverHeader?: string;
  contentType?: string;
  suspicious: string[];
};

// Private/internal IP ranges that should never be fetched
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^localhost$/i,
];

function isPrivateAddress(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Analyze a URL for suspicious characteristics.
 * Performs server-side-only fetching with safety guards.
 */
export async function analyzeUrl(urlString: string): Promise<UrlAnalysisResult> {
  const suspicious: string[] = [];

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return {
      isValid: false,
      domain: "",
      protocol: "",
      hasSSL: false,
      redirectCount: 0,
      finalUrl: urlString,
      suspicious: ["Invalid URL format"],
    };
  }

  const domain = url.hostname;
  const protocol = url.protocol;
  const hasSSL = protocol === "https:";

  // Block requests to private/internal networks
  if (isPrivateAddress(domain)) {
    return {
      isValid: false,
      domain,
      protocol,
      hasSSL,
      redirectCount: 0,
      finalUrl: urlString,
      suspicious: ["URL points to a private/internal network address"],
    };
  }

  // Check for suspicious URL characteristics
  if (!hasSSL) {
    suspicious.push("No SSL/HTTPS - connection is not encrypted");
  }

  // Check for IP address instead of domain name
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    suspicious.push("Uses IP address instead of domain name");
  }

  // Check for excessive subdomains (potential subdomain abuse)
  const subdomainCount = domain.split(".").length - 2;
  if (subdomainCount > 2) {
    suspicious.push(`Excessive subdomains (${subdomainCount}) - potential domain spoofing`);
  }

  // Check for suspicious TLDs
  const suspiciousTlds = [".xyz", ".top", ".click", ".buzz", ".gq", ".ml", ".cf", ".tk", ".ga"];
  if (suspiciousTlds.some((tld) => domain.endsWith(tld))) {
    suspicious.push("Uses a TLD commonly associated with spam/scam sites");
  }

  // Check for common brand typosquatting patterns
  const commonBrands = ["paypal", "amazon", "apple", "google", "microsoft", "facebook", "netflix", "bank"];
  for (const brand of commonBrands) {
    if (domain.includes(brand) && !domain.endsWith(`.${brand}.com`) && domain !== `${brand}.com` && domain !== `www.${brand}.com`) {
      suspicious.push(`Domain contains "${brand}" but is not the official ${brand}.com domain`);
    }
  }

  // Check for URL-encoded characters in path (potential obfuscation)
  if (url.pathname.includes("%") && url.pathname.match(/%[0-9a-f]{2}/i)) {
    suspicious.push("URL contains encoded characters (potential obfuscation)");
  }

  // Try to follow redirects safely
  let redirectCount = 0;
  let finalUrl = urlString;
  let responseCode: number | undefined;
  let serverHeader: string | undefined;
  let contentType: string | undefined;

  try {
    const response = await fetch(urlString, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "ScamShield/1.0 Security Scanner",
      },
    });

    finalUrl = response.url;
    responseCode = response.status;
    serverHeader = response.headers.get("server") || undefined;
    contentType = response.headers.get("content-type") || undefined;

    // Count redirects by comparing URLs
    if (response.url !== urlString) {
      // We can't easily count exact redirects with fetch, but we know it redirected
      redirectCount = 1;
      const finalDomain = new URL(response.url).hostname;
      if (finalDomain !== domain) {
        suspicious.push(`Redirects to a different domain: ${finalDomain}`);
      }
    }
  } catch {
    suspicious.push("URL is unreachable or timed out");
  }

  return {
    isValid: true,
    domain,
    protocol,
    hasSSL,
    redirectCount,
    finalUrl,
    responseCode,
    serverHeader,
    contentType,
    suspicious,
  };
}
