module.exports = {
  publicRuntimeConfig: {
    conductor: {
      keyId: "5524bf66-1173-4888-b345-55f0eadf01b8",
      keySecret: "uWNfvUhgeiAQmYkQ6JsgK6CYBNpgOAbYlbaYiNWN7YILSzv9",
      serverUrl: "https://conductor-new-ui-888h.vercel.app/api",
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
