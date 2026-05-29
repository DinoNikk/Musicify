module.exports = {
  nodes: [
    {
      name: "Lavalink-Cua-Toi",
      host: "lavalink-2026-production-cca6.up.railway.app", // Sử dụng domain public trong ảnh của bạn
      port: 443, // BẮT BUỘC đổi thành cổng 443
      password: "youshallnotpass", // Giữ nguyên nếu password ở tab Variables là cái này
      secure: true // BẮT BUỘC đổi thành true
    }
  ],

    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4",

    accentColor: 0x2b2d31,

    // Musicard theme config
    musicard: {
        theme: "Bloom",
        progressBarColor: "#FACC15",
        backgroundColor: "#2b2d31",
    },
};
