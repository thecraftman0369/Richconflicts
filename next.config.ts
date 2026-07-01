import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: 'gfkbfouhlctmmlgehbgt.supabase.co' },
    ],
  },
}

export default nextConfig
