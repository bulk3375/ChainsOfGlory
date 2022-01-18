module.exports = {
  reactStrictMode: true,

  webpack(config, options) {
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: 'url-loader',
      },
    });
    return config;
  },

  // webpack: (config, {isServer }) => {
  //   if(!isServer) {
  //     config.resolve.fallback.fs = false
  //   }

  //   return config
  // },
  images: {
    domains: [
      "thrangra.sirv.com"
    ]
  }
}
