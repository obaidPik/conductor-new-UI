module.exports = {
  publicRuntimeConfig: {
    conductor: {
      keyId: "fb4ca6c9-8762-44e6-ad17-98b6be97736d",
      keySecret: "v2c1qiBaoTpsKfTBlDmBZECzCwh11WA3f1Eq3jX1swe5HOqG",
      serverUrl: "https://conductor-6orq6si28-obaidpik.vercel.app/",
    },
    workflows:{
      checkout:`ob-checkout`,
      
    }
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",

        destination: 'https://tmo-poc.orkesconductor.io/api/:path*',
      },
    ];
  },
};
