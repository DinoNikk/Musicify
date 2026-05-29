const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { getGuildData } = require("../utils/playerStore");
const { setGuildSetting, getGuildSettings } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("247")
        .setDescription("Hung tao ra de treo may a :))"),

    async execute(interaction, client) {
        if (!interaction.member.voice?.channel) {
            return interaction.reply({
                content: "❌ You need to be in a voice channel!",
                flags: MessageFlags.Ephemeral,
            });
        }

        const guildId = interaction.guild.id;
        
        try {
            const guildData = getGuildData(guildId);
            // Lấy cài đặt từ DB, nếu chưa có thì mặc định là một object trống {}
            const dbSettings = getGuildSettings(guildId) || {};

            // Nếu dbSettings.twentyFourSeven chưa tồn tại (undefined), nó sẽ tự hiểu là false, đảo ngược thành true
            const newState = !dbSettings.twentyFourSeven;
            
            // Cập nhật trạng thái vào bộ nhớ tạm và DB
            if (guildData) guildData.twentyFourSeven = newState;
            setGuildSetting(guildId, "twentyFourSeven", newState);

            // Nếu bật chế độ 24/7, tự động kết nối vào Voice Channel nếu chưa có player
            if (newState) {
                let player = client.riffy.players.get(guildId);
                if (!player) {
                    player = client.riffy.createConnection({
                        guildId: guildId,
                        voiceChannel: interaction.member.voice.channel.id,
                        textChannel: interaction.channel.id,
                        deaf: true,
                    });
                }
            }

            // Thiết lập nội dung hiển thị dạng Embed chuẩn
            const emoji = newState ? "✅" : "⏹";
            const label = newState ? "Enabled" : "Disabled";
            const desc = newState
                ? "Active — I'll stay in the voice channel."
                : "Inactive — I'll leave when the queue is empty.";

            const embed = new EmbedBuilder()
                .setColor(newState ? "#57f287" : "#ed4245") // Xanh khi bật, Đỏ khi tắt
                .setTitle(`${emoji} 24/7 Mode ${label}`)
                .setDescription(
                    `**Status**\n-# ${desc}\n\n` +
                    `**Persists**\n-# This setting is saved across bot restarts.`
                );

            // Phản hồi lại user bằng Embed, ẩn tin nhắn (Ephemeral)
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });

        } catch (error) {
            console.error("[Musicify] 24/7 Command Error:", error);
            return interaction.reply({
                content: "❌ An error occurred while toggling 24/7 mode.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
