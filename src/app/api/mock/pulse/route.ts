import { NextResponse } from 'next/server';

export async function GET() {
  // Simulate a high-value health score calculation
  const score = Math.floor(Math.random() * 40) + 60; // 60-100 for "healthy-ish" feel
  
  const insights = [
    "System throughput is optimal with 12% headroom.",
    "API latency is trending down in multi-region clusters.",
    "Storage capacity is healthy; forecast predicts 30 days of growth.",
    "Security signals are clear with no anomalous login patterns.",
    "User engagement is peaking in the APAC region today."
  ];

  const randomInsight = insights[Math.floor(Math.random() * insights.length)];

  return NextResponse.json({
    score,
    status: score > 85 ? 'optimal' : score > 70 ? 'stable' : 'warning',
    insight: randomInsight,
    timestamp: new Date().toISOString()
  });
}
