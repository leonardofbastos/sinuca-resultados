/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/prismeira',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
