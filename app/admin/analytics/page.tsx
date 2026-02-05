"use client";

import { useEffect, useState } from "react";
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, SCAM_TYPE_LABELS } from "@/lib/constants";

type AnalyticsData = {
  summary: { totalAnalyses: number; totalConversations: number; totalClients: number };
  riskDistribution: Array<{ level: string; count: number }>;
  scamTypeDistribution: Array<{ type: string; count: number }>;
  recentAnalyses: Array<{
    id: string;
    riskScore: number;
    riskLevel: string;
    scamType: string | null;
    inputType: string;
    processingTimeMs: number | null;
    clientName: string;
    createdAt: string;
  }>;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalRisks = data.riskDistribution.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Risk Level Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Breakdown</h2>

        {/* Visual bar chart */}
        <div className="flex items-end gap-2 h-40 mb-4">
          {["SAFE", "LOW_RISK", "SUSPICIOUS", "LIKELY_SCAM", "CONFIRMED_SCAM"].map((level) => {
            const item = data.riskDistribution.find((r) => r.level === level);
            const count = item?.count || 0;
            const pct = Math.max(5, (count / totalRisks) * 100);
            const colors = RISK_LEVEL_COLORS[level as keyof typeof RISK_LEVEL_COLORS];

            return (
              <div key={level} className="flex-1 flex flex-col items-center">
                <span className="text-xs font-medium text-gray-700 mb-1">{count}</span>
                <div className={`w-full rounded-t-lg ${colors?.dot || "bg-gray-400"}`} style={{ height: `${pct}%` }} />
                <span className="text-[10px] text-gray-500 mt-2 text-center">
                  {RISK_LEVEL_LABELS[level as keyof typeof RISK_LEVEL_LABELS]?.replace(" ", "\n") || level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scam Types */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detected Scam Types</h2>
        {data.scamTypeDistribution.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No scams detected in this period</p>
        ) : (
          <div className="space-y-3">
            {data.scamTypeDistribution.map((item) => {
              const maxCount = data.scamTypeDistribution[0]?.count || 1;
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{SCAM_TYPE_LABELS[item.type] || item.type}</span>
                    <span className="text-gray-500 font-medium">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Analysis Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Client</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Score</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Risk Level</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Scam Type</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Input</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAnalyses.map((a) => {
                const colors = RISK_LEVEL_COLORS[a.riskLevel as keyof typeof RISK_LEVEL_COLORS];
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-500">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-2 text-gray-700">{a.clientName}</td>
                    <td className="py-2 px-2 font-medium">{a.riskScore}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors?.bg} ${colors?.text}`}>
                        {RISK_LEVEL_LABELS[a.riskLevel as keyof typeof RISK_LEVEL_LABELS] || a.riskLevel}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">{a.scamType ? (SCAM_TYPE_LABELS[a.scamType] || a.scamType) : "-"}</td>
                    <td className="py-2 px-2 text-gray-500">{a.inputType}</td>
                    <td className="py-2 px-2 text-gray-400">{a.processingTimeMs ? `${(a.processingTimeMs / 1000).toFixed(1)}s` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
