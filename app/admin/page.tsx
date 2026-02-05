"use client";

import { useEffect, useState } from "react";
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, SCAM_TYPE_LABELS } from "@/lib/constants";

type AnalyticsData = {
  summary: {
    totalAnalyses: number;
    totalConversations: number;
    totalClients: number;
  };
  riskDistribution: Array<{ level: string; count: number }>;
  scamTypeDistribution: Array<{ type: string; count: number }>;
  recentAnalyses: Array<{
    id: string;
    riskScore: number;
    riskLevel: string;
    scamType: string | null;
    inputType: string;
    clientName: string;
    createdAt: string;
  }>;
};

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics?days=30")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-gray-500">Failed to load analytics.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Analyses</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.totalAnalyses}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.totalConversations}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Active Clients</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">Total</p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            {data.riskDistribution.map((item) => {
              const colors = RISK_LEVEL_COLORS[item.level as keyof typeof RISK_LEVEL_COLORS];
              const label = RISK_LEVEL_LABELS[item.level as keyof typeof RISK_LEVEL_LABELS] || item.level;
              const total = data.riskDistribution.reduce((sum, r) => sum + r.count, 0) || 1;
              const pct = Math.round((item.count / total) * 100);

              return (
                <div key={item.level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colors?.dot || "bg-gray-400"}`} />
                      {label}
                    </span>
                    <span className="text-gray-500">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors?.dot || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.riskDistribution.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Scam Types</h2>
          <div className="space-y-3">
            {data.scamTypeDistribution.map((item) => (
              <div key={item.type} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{SCAM_TYPE_LABELS[item.type] || item.type}</span>
                <span className="text-gray-500 font-medium">{item.count}</span>
              </div>
            ))}
            {data.scamTypeDistribution.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No scams detected yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Analyses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Client</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Risk</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Type</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Input</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAnalyses.map((a) => {
                const colors = RISK_LEVEL_COLORS[a.riskLevel as keyof typeof RISK_LEVEL_COLORS];
                return (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 text-gray-700">{a.clientName}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors?.bg} ${colors?.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors?.dot}`} />
                        {a.riskScore}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">{a.scamType ? (SCAM_TYPE_LABELS[a.scamType] || a.scamType) : "-"}</td>
                    <td className="py-2 px-2 text-gray-500">{a.inputType}</td>
                    <td className="py-2 px-2 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {data.recentAnalyses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No analyses yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
