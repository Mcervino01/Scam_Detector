type SafeBrowsingResult = {
  isFlagged: boolean;
  threats: string[];
};

/**
 * Check a URL against Google Safe Browsing API.
 * Free tier: 10,000 lookups/day.
 * Returns { isFlagged, threats } where threats is an array of threat types found.
 */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) {
    return { isFlagged: false, threats: [] };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "scamshield", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.error(`Safe Browsing API error: ${response.status}`);
      return { isFlagged: false, threats: [] };
    }

    const data = await response.json();
    const matches = data.matches || [];

    return {
      isFlagged: matches.length > 0,
      threats: matches.map((m: { threatType: string }) => m.threatType),
    };
  } catch (error) {
    console.error("Safe Browsing lookup failed:", error);
    return { isFlagged: false, threats: [] };
  }
}
