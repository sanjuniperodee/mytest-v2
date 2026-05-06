/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mytest.kz",
      },
      {
        protocol: "https",
        hostname: "**.mytest.kz",
      },
      {
        protocol: "https",
        hostname: "bilimland.kz",
      },
      {
        protocol: "https",
        hostname: "**.bilimland.kz",
      },
    ],
  },
}

export default nextConfig
