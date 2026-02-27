import { WidgetConfig } from '../types/widget';

export const dashboardWidgets: WidgetConfig[] = [
  {
    id: 'jonreygalera-github-repos',
    type: 'stat',
    label: 'Jon Rey | GitHub Public Repos',
    api: 'https://api.github.com/users/jonreygalera',
    method: 'GET',
    responsePath: 'public_repos',
    size: 'sm',
    description: 'Number of public repositories on GitHub',
    refreshInterval: 0,
    source: 'GitHub',
    sourceUrl: 'https://github.com/jonreygalera?tab=repositories',
    color: 'info'
  },
  {
    id: 'jonreygalera-github-followers',
    type: 'stat',
    label: 'Jon Rey | GitHub Followers',
    api: 'https://api.github.com/users/jonreygalera',
    method: 'GET',
    responsePath: 'followers',
    size: 'sm',
    description: 'Number of followers on GitHub',
    refreshInterval: 0,
    source: 'GitHub',
    sourceUrl: 'https://github.com/jonreygalera?tab=followers',
    color: 'up'
  },
  {
    id: 'jonreygalera-github-following',
    type: 'stat',
    label: 'Jon Rey | GitHub Following',
    api: 'https://api.github.com/users/jonreygalera',
    method: 'GET',
    responsePath: 'following',
    size: 'sm',
    description: 'Number of users followed on GitHub',
    refreshInterval: 0,
    source: 'GitHub',
    sourceUrl: 'https://github.com/jonreygalera?tab=following',
    color: 'muted'
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
    color: 'up'
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
    color: 'up'
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
    suffix: "°C",
    colorRules: {
      rules: [
        { condition: 'below', value: 18, color: 'up' },   // Nice & Cold (Green)
        { condition: 'above', value: 25, color: 'down' }, // Too Hot (Red)
      ]
    }
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
    prefix: "$",
    refreshInterval: 300000,
    source: "finance.yahoo.com",
    sourceUrl: "https://finance.yahoo.com/quote/BTC-USD",
    color: "up"
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
    } 
  },
  {
    id: 'gold-futures-chart',
    type: 'line',
    label: 'Gold Futures (GC=F) - 5m',
    api: '/api/yahoo?symbol=GC=F&range=1d&interval=5m',
    method: 'GET',
    responsePath: 'series',
    xKey: 'timestamp',
    yKey: 'price',
    size: 'lg',
    description: 'Today\'s 5-minute interval price action for Gold',
    prefix: '$',
    refreshInterval: 300000, // 5 minutes matching candle interval
    source: 'finance.yahoo.com',
    sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
  },
  {
    id: 'traffic-sources-bar',
    type: 'bar',
    label: 'Traffic Sources - DEMO',
    api: '/api/mock',
    method: 'POST',
    body: {
      metric: 'traffic-sources',
    },
    responsePath: 'stats.trafficData',
    xKey: 'source',
    yKey: 'visits',
    size: 'md',
    description: 'Distribution of traffic sources',
    refreshInterval: 10000,
  },
  {
    id: 'revenue-trends-area',
    type: 'area',
    label: 'Revenue Trends - DEMO',
    api: '/api/mock?type=chart-revenue',
    method: 'GET',
    responsePath: 'result.series',
    xKey: 'day',
    yKey: 'revenue',
    size: 'lg',
    description: 'Weekly revenue growth visualization',
    refreshInterval: 60000,
    prefix: '$',
  },
];
