import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '喵喵影视 - 在线视频',
    short_name: '喵喵影视',
    description: '免费在线观看最新电影、电视剧、综艺、动漫、体育赛事',
    start_url: '/',
    display: 'standalone',
    background_color: '#02050a',
    theme_color: '#02050a',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
