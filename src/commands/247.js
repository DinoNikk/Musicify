const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("247")
        .setDescription("Toggle 24/7 mode — bot stays in VC even when queue is empty"),

    async execute(interaction, client) {
        if (!interaction.member.voice?.channel) {
            return interaction.reply({
                content: "❌ You need to be in a voice channel!",
                flags: MessageFlags.Ephemeral,
            });
        }

        const guildId = interaction.guild.id;
        
        try {
            console.log("[Debug 24/7] Step 1: Lệnh được gọi, bắt đầu import file...");
            const { getGuildData } = require("../utils/playerStore");
            const { setGuildSetting, getGuildSettings } = require("../utils/database");

            console.log("[Debug 24/7] Step 2: Đọc dữ liệu từ playerStore và Database...");
            let guildData = null;
            try { guildData = getGuildData(guildId); } catch(e) { console.log("Lỗi tại getGuildData:", e.message); }
            
            let dbSettings = {};
            try { dbSettings = getGuildSettings(guildId) || {}; } catch(e) { console.log("Lỗi tại getGuildSettings:", e.message); }

            console.log("[Debug 24/7] Step 3: Tính toán trạng thái mới...");
            const newState = !dbSettings.twentyFourSeven;
            
            console.log("[Debug 24/7] Step 4: Ghi dữ liệu mới vào DB...");
            if (guildData) guildData.twentyFourSeven = newState;
            try { setGuildSetting(guildId, "twentyFourSeven", newState); } catch(e) { console.log("Lỗi tại setGuildSetting:", e.message); }

            console.log("[Debug 24/7] Step 5: Kiểm tra hệ thống Riffy...");
            if (!client.riffy) {
                throw new Error("client.riffy chưa được định nghĩa! Hãy kiểm tra lại file khởi tạo bot.");
            }

            if (newState) {
                let player = client.riffy.players.get(guildId);
                if (!player) {
                    console.log("[Debug 24/7] Step 5.1: Đang tạo kết nối chơi nhạc 24/7...");
                    player = client.riffy.createConnection({
                        guildId: guildId,
                        voiceChannel: interaction.member.voice.channel.id,
                        textChannel: interaction.channel.id,
                        deaf: true,
                    });
                }
            }

            console.log("[Debug 24/7] Step 6: Chuẩn bị gửi Embed phản hồi...");
            const emoji = newState ? "✅" : "⏹";
            const label = newState ? "Enabled" : "Disabled";
            const desc = newState ? "Active — I'll stay in the voice channel." : "Inactive — I'll leave when the queue is empty.";

            const embed = new EmbedBuilder()
                .setColor(newState ? "#57f287" : "#ed4245")
                .setTitle(`${emoji} 24/7 Mode ${label}`)
                .setDescription(`**Status**\n-# ${desc}\n\n**Persists**\n-# This setting is saved across bot restarts.`);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            console.log("[Debug 24/7] Step 7: Hoàn thành lệnh thành công!");

        } catch (error) {
            console.error("[Musicify Critical Error] Lỗi nghiêm trọng khiến lệnh thất bại:", error);
            return interaction.reply({
                content: `❌ Lỗi hệ thống: ${error.message}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
