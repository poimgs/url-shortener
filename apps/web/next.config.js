/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
