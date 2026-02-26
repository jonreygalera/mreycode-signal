import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Random data generator
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (type === 'stat-users') {
    return NextResponse.json({
      data: {
        metrics: {
          totalUsers: getRandomInt(10000, 50000),
        },
      },
    });
  }

  if (type === 'chart-revenue') {
    const data = Array.from({ length: 7 }).map((_, i) => ({
      day: `Day ${i + 1}`,
      revenue: getRandomInt(1000, 5000),
    }));
    return NextResponse.json({
      result: {
        series: data,
      },
    });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

export async function POST(request: Request) {
  // Try to parse headers/body
  const authHeader = request.headers.get('Authorization');
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  // Random data generator
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // We check the requested metric from body
  if (body.metric === 'random-number') {
    // Requires a fake token to demonstrate header usage
    if (authHeader !== 'Bearer mreycode-signal-demo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      payload: {
        sessions: getRandomInt(-6000, 6000),
      },
    });
  }

  if (body.metric === 'traffic-sources') {
    const data = [
      { source: 'Organic', visits: getRandomInt(2000, 5000) },
      { source: 'Direct', visits: getRandomInt(1000, 3000) },
      { source: 'Social', visits: getRandomInt(500, 1500) },
      { source: 'Referral', visits: getRandomInt(200, 800) },
    ];
    return NextResponse.json({
      stats: {
        trafficData: data,
      },
    });
  }

  return NextResponse.json({ error: 'Unknown metric' }, { status: 400 });
}
