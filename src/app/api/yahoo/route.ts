import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'GC=F';
  const range = searchParams.get('range') || '1d';
  const interval = searchParams.get('interval') || '5m';

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo API returned ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error('No chart result found');
    }

    const timestamps = result.timestamp || [];
    const closePrices = result.indicators?.quote?.[0]?.close || [];

    // Map the parallel arrays into a single array of objects
    const series = timestamps.map((time: number, index: number) => {
      // Format the time directly to a short localized string like "10:00 AM" or similar for the chart to easily read
      const date = new Date(time * 1000);
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      const priceValue = closePrices[index];
      return {
        timestamp: timeStr,
        price: priceValue !== null && priceValue !== undefined ? Number(Number(priceValue).toFixed(2)) : null
      };
    }).filter((item: any) => item.price !== null); // Filter out nulls from missing market data

    return NextResponse.json({ series });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
