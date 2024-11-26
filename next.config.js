/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'chrome-aws-lambda': 'chrome-aws-lambda/build/index.js',
    };
    return config;
  },
}

module.exports = nextConfig