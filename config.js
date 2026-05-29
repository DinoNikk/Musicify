module.exports = {
    nodes: [
    {
      name: "Lavalink-Cua-Toi",
      host: "lavalink-2026.production.up.railway.internal", // <--- Sử dụng chính xác đường dẫn có đuôi .internal này
      port: 2333, 
      password: "youshallnotpass", 
      secure: false // BẮT BUỘC ĐỂ FALSE vì là mạng nội bộ
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
