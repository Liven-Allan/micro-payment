"use client";

import React, { useEffect, useState } from "react";

type Rec = {
  protocol: string;
  action: "stake" | "wait" | "consider" | "none";
  apr?: number;
  confidence: number;
  reason: string;
};

export default function StakingRecommendations({
  apiUrl = "/mock-staking-recs.json",
  className = "",
}: {
  apiUrl?: string;
  className?: string;
}) {
  const [data, setData] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(apiUrl)
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (!mounted) return;
        setData(json as Rec[]);
      })
      .catch(e => {
        if (!mounted) return;
        setError(String(e.message || e));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  if (loading) return <div className={className}>Loading staking recommendations…</div>;
  if (error) return <div className={className}>Failed to load recommendations: {error}</div>;
  if (!data || data.length === 0) return <div className={className}>No recommendations available.</div>;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold mb-2">Staking Recommendations</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="px-2 py-1">Protocol</th>
              <th className="px-2 py-1">Recommendation</th>
              <th className="px-2 py-1">APR</th>
              <th className="px-2 py-1">Confidence</th>
              <th className="px-2 py-1">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.protocol} className="border-t">
                <td className="px-2 py-2 font-medium">{r.protocol}</td>
                <td className="px-2 py-2">
                  {r.action === "stake"
                    ? "Stake"
                    : r.action === "wait"
                      ? "Wait"
                      : r.action === "consider"
                        ? "Consider"
                        : "N/A"}
                </td>
                <td className="px-2 py-2">{r.apr !== undefined ? `${(r.apr * 100).toFixed(2)}%` : "—"}</td>
                <td className="px-2 py-2">{Math.round(r.confidence * 100)}%</td>
                <td className="px-2 py-2 text-xs text-gray-600">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
