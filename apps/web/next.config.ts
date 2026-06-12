import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@splitroads/contracts'],
  experimental: { typedRoutes: true },
}

export default config
