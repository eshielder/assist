/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Allow large function package sizes / request bodies on Vercel Functions.
  api: {
    // Increase body size limit for STT uploads / large payloads.
    bodySizeLimit: "10mb",
  },
};

export default nextConfig;