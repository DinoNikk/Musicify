const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Tìm hiểu thêm về tôi"),

    async execute(interaction, client) {
        const container = new ContainerBuilder();

        const botAvatar = client.user.displayAvatarURL({ size: 256 });

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "# <:Musicify_Logo:1504329028356673536> Tìm hiểu"
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(botAvatar)
                )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "**Tôi là ai ?**\n" +
                "-# Tôi là 1 bot được tạo ra để treo máy giữ chuỗi và chơi nhạc\n" 
                
            )
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# Tôi được làm bởi nikki bạn có thể tìm thấy tôi ở git anh ấy."
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Support Server")
                .setURL("####")
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel("⭐ Vote")
                .setURL("####")
                .setStyle(ButtonStyle.Link)
        );

        container.addActionRowComponents(row);

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
