/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: `${process.env.API_URL || 'http://localhost:4000'}/trpc/:path*`,
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
