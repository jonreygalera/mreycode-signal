import { MetadataRoute } from 'next';
import { appConfig } from '@/config/app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: 'Signal',
    description: appConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
