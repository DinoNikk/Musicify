const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");
const { getGuildData } = require("../utils/playerStore");
const { setGuildSetting, getGuildSettings } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("247")
        .setDescription("Đây là tính năng tui tạo ra để treo ạ =~="),

    async execute(interaction, client) {
        if (!interaction.member.voice?.channel) {
            return interaction.reply({
                content: "❌ Vô kênh thoại đi chứ rôi mới dùng lệnh mom ơi!",
                flags: MessageFlags.Ephemeral,
            });
        }

        const guildId = interaction.guild.id;
        const guildData = getGuildData(guildId);
        const dbSettings = getGuildSettings(guildId);

        const newState = !dbSettings.twentyFourSeven;
        guildData.twentyFourSeven = newState;
        setGuildSetting(guildId, "twentyFourSeven", newState);

        if (newState) {
            let player = client.riffy.players.get(guildId);
            if (!player) {
                // Đảm bảo truyền đúng các tham số này
                player = client.riffy.createConnection({
                    guildId: guildId,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    deaf: true,
                });
            }
            
            // THÊM DÒNG NÀY: Nếu player chưa kết nối, bắt nó kết nối
            if (player) {
                player.connect();
            }
        }

        const emoji = newState ? "✅" : "⏹";
        const label = newState ? "Enabled" : "Disabled";
        const desc = newState
            ? "Active — Tui sẽ ở đây."
            : "Inactive — Lưu trữ tại đây .";

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${emoji} 24/7 Mode ${label}\n\n` +
                "**Status**\n" +
                `-# ${desc}\n\n` +
                "**Persists**\n" +
                "-# This setting is saved across bot restarts."
            )
        );
        await interaction.reply({
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    },
};
