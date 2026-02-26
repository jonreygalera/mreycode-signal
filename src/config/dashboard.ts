import { WidgetConfig } from '../types/widget';

export const dashboardWidgets: WidgetConfig[] = [
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
  }
];
