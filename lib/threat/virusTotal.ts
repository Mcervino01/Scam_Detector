type VirusTotalResult = {
  positives: number;
  total: number;
  scanDate?: string;
  permalink?: string;
};

/**
 * Check a URL against VirusTotal API.
 * Free tier: 500 requests/day, 4 requests/minute.
 * Submits URL for scanning and retrieves results.
 */
export async function checkVirusTotal(url: string): Promise<VirusTotalResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { positives: 0, total: 0 };
  }

  try {
    // Encode URL as base64 for the v3 API
    const urlId = Buffer.from(url).toString("base64url");

    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { "x-apikey": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 404) {
      // URL not previously scanned - submit it
      const submitResponse = await fetch("https://www.virustotal.com/api/v3/urls", {
        method: "POST",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(10000),
      });

      if (!submitResponse.ok) {
        return { positives: 0, total: 0 };
      }

      // Wait briefly for scan to process, then check results
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const retryResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { "x-apikey": apiKey },
        signal: AbortSignal.timeout(10000),
      });

      if (!retryResponse.ok) {
        return { positives: 0, total: 0 };
      }

      const retryData = await retryResponse.json();
      const stats = retryData.data?.attributes?.last_analysis_stats || {};
      return {
        positives: (stats.malicious || 0) + (stats.suspicious || 0),
        total: Object.values(stats).reduce((a: number, b) => a + (b as number), 0) as number,
        scanDate: retryData.data?.attributes?.last_analysis_date,
      };
    }

    if (!response.ok) {
      console.error(`VirusTotal API error: ${response.status}`);
      return { positives: 0, total: 0 };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};

    return {
      positives: (stats.malicious || 0) + (stats.suspicious || 0),
      total: Object.values(stats).reduce((a: number, b) => a + (b as number), 0) as number,
      scanDate: data.data?.attributes?.last_analysis_date,
    };
  } catch (error) {
    console.error("VirusTotal lookup failed:", error);
    return { positives: 0, total: 0 };
  }
}
