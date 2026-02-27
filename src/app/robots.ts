import { MetadataRoute } from 'next';
import { appConfig } from '@/config/app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}
