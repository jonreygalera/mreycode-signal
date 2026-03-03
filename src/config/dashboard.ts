import { WidgetConfig } from '../types/widget';

export const dashboardWidgets: WidgetConfig[] = [
  {
    id: 'mreycode-signal-vercel-app-total-visits',
    type: 'stat',
    label: 'mreycode-signal.vercel.app Total Visits',
    api: 'https://api-mreyai.vercel.app/api/guest/stats',
    method: 'GET',
    headers: {
      'x-mrey-tenant': 'mreycode-signal.vercel.app',
    },
    responsePath: 'count',
    size: 'sm',
    description: 'Total visits on mreycode-signal.vercel.app',
    refreshInterval: 5000, 
    color: 'up',
    config: {},
  },
  {
    id: 'mrey-ai-vercel-app-total-visits',
    type: 'stat',
    label: 'mrey-ai.vercel.app Total Visits',
    api: 'https://api-mreyai.vercel.app/api/guest/stats',
    method: 'GET',
    headers: {
      'x-mrey-tenant': 'mrey-ai.vercel.app',
    },
    responsePath: 'count',
    size: 'sm',
    description: 'Total visits on mrey-ai.vercel.app',
    refreshInterval: 5000, 
    color: 'up',
    config: {},
  },
  {
    id: 'jonreygalera-vercel-app-total-visits',
    type: 'stat',
    label: 'jonreygalera.vercel.app Total Visits',
    api: 'https://api-mreyai.vercel.app/api/guest/stats',
    method: 'GET',
    headers: {
      'x-mrey-tenant': 'jonreygalera.vercel.app',
    },
    responsePath: 'count',
    size: 'sm',
    description: 'Total visits on jonreygalera.vercel.app',
    refreshInterval: 5000, 
    color: 'up',
    config: {},
  },
  {
    id: "baguio-city-ph-temperature",
    type: "stat",
    label: "Baguio City PH Temperature",
    api: "https://api.open-meteo.com/v1/forecast?latitude=16.4023&longitude=120.5960&current_weather=true",
    method: "GET",
    responsePath: "current_weather.temperature",
    size: "sm",
    description: "Baguio City PH Temperature",
    refreshInterval: 3600000,
    sourceUrl: "https://api.open-meteo.com/v1/forecast?latitude=16.4023&longitude=120.5960&current_weather=true",
    colorRules: {
      rules: [
        { condition: 'below', value: 18, color: 'up' },   // Nice & Cold (Green)
        { condition: 'above', value: 25, color: 'down' }, // Too Hot (Red)
      ]
    },
    config: {
      suffix: "°C",
    },
    signals: [
      {
        id: 'cold-alert',
        label: 'It\'s Cold in Baguio!',
        condition: 'below',
        threshold: 15,
        action: ['pulse', 'notify', 'sound', 'notify-in-app'],
        duration: 10,
        enabled: true
      },
      {
        id: 'hot-alert',
        label: 'It\'s Hot in Baguio!',
        condition: 'above',
        threshold: 25,
        action: ['pulse', 'notify', 'sound', 'notify-in-app'],
        duration: 10,
        enabled: true
      }
    ],
  },
  {
    id: "tpl-gold-price-6247",
    type: "stat",
    label: "BTC-USD (BTC-USD)",
    api: "/api/yahoo?symbol=BTC-USD&range=1d&interval=1d",
    method: "GET",
    responsePath: "series.0.price",
    size: "sm",
    description: "Today's BTC-USD price",
    refreshInterval: 300000,
    source: "finance.yahoo.com",
    sourceUrl: "https://finance.yahoo.com/quote/BTC-USD",
    color: "up",
    config: {
      prefix: "$",
    },
  },  
  {
    id: 'philippines-population',
    type: 'stat',
    label: 'Philippines Population',
    api: 'https://restcountries.com/v3.1/name/philippines',
    method: 'GET',
    responsePath: '0.population',
    size: 'sm',
    description: 'Current population of the Philippines',
    refreshInterval: 3600000, // 1 hour (doesn't change fast)
    sourceUrl: 'https://restcountries.com/v3.1/name/philippines',
    config: {},
  },
  {
    id: 'random-number',
    type: 'stat',
    label: 'Random Number',
    api: '/api/mock',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer mreycode-signal-demo',
      'Content-Type': 'application/json',
    },
    body: {
      metric: 'random-number',
    },
    responsePath: 'payload.sessions',
    size: 'sm',
    description: 'Current random number',
    refreshInterval: 3000, 
    colorRules: {
      aboveZero: "up",      // Green if profit
      belowZero: "down",    // Red if loss
      atZero: "muted"       // Gray if neutral
    },
    signals: [
      {
        id: 'random-number-alert',
        label: 'Random Number Alert!',
        condition: 'below',
        threshold: 30,
        action: ['pulse', 'notify-in-app', 'sound'],
        enabled: true,
        duration: 10,
      }
    ],
    config: {},
  },
  {
    id: 'gold-futures-chart',
    type: 'chart',
    label: 'Gold Futures (GC=F) - 5m',
    api: '/api/yahoo?symbol=GC=F&range=1d&interval=5m',
    method: 'GET',
    responsePath: 'series',
    size: 'lg',
    description: 'Today\'s 5-minute interval price action for Gold',
    refreshInterval: 300000, // 5 minutes matching candle interval
    source: 'finance.yahoo.com',
    sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
    config: {
      chart: 'line',
      xKey: 'timestamp',
      yKey: 'price',
      prefix: '$',
    },
  },
  {
    id: 'traffic-sources-bar',
    type: 'chart',
    label: 'Traffic Sources - DEMO',
    api: '/api/mock',
    method: 'POST',
    body: {
      metric: 'traffic-sources',
    },
    responsePath: 'stats.trafficData',
    size: 'md',
    description: 'Distribution of traffic sources',
    refreshInterval: 10000,
    config: {
      chart: 'bar',
      xKey: 'source',
      yKey: 'visits',
    },
  },
  {
    id: 'revenue-trends-area',
    type: 'chart',
    label: 'Revenue Trends - DEMO',
    api: '/api/mock?type=chart-revenue',
    method: 'GET',
    responsePath: 'result.series',
    size: 'lg',
    description: 'Weekly revenue growth visualization',
    refreshInterval: 60000,
    config: {
      chart: 'area',
      xKey: 'day',
      yKey: 'revenue',
      prefix: '$',
    },
  }
];
