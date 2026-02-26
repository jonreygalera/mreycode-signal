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
  },
  {
    id: 'active-sessions',
    type: 'stat',
    label: 'Active Sessions',
    api: '/api/mock',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer mreycode-signal-demo',
      'Content-Type': 'application/json',
    },
    body: {
      metric: 'active-sessions',
    },
    responsePath: 'payload.sessions',
    size: 'sm',
    description: 'Current active connections',
  },
  {
    id: 'revenue-chart',
    type: 'area',
    label: 'Revenue Overview',
    api: '/api/mock?type=chart-revenue',
    method: 'GET',
    responsePath: 'result.series',
    xKey: 'day',
    yKey: 'revenue',
    size: 'lg',
    description: 'Daily revenue generated in the last 7 days',
    prefix: '$',
  },
  {
    id: 'traffic-sources',
    type: 'bar',
    label: 'Traffic Sources',
    api: '/api/mock',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      metric: 'traffic-sources',
    },
    responsePath: 'stats.trafficData',
    xKey: 'source',
    yKey: 'visits',
    size: 'md',
    description: 'Breakdown of site visits by source',
  }
];
