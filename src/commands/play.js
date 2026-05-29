const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { getGuildData } = require("../utils/playerStore");

// Hàm bổ trợ kiểm tra trùng lặp bài hát
function isTrackDuplicate(player, track) {
    if (!player) return false;
    const currentUri = player.current?.info?.uri;
    const inQueue = player.queue?.some(existing => existing.info.uri === track.info.uri);
    return inQueue || currentUri === track.info.uri;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song or add it to the queue")
        .addStringOption((opt) =>
            opt.setName("query").setDescription("Song name or URL").setRequired(true)
        ),

    async execute(interaction, client) {
        const query = interaction.options.getString("query");

        // 1. Kiểm tra link YouTube
        if (/(?:youtube\.com|youtu\.be)/i.test(query)) {
            return interaction.reply({
                content: "❌ YouTube links are currently not supported.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const member = interaction.member;
        if (!member.voice?.channel) {
            return interaction.reply({
                content: "❌ You need to be in a voice channel!",
                flags: MessageFlags.Ephemeral,
            });
        }

        // Hoãn phản hồi
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // 2. Thiết lập hoặc lấy Player hiện tại
            const guildData = getGuildData(interaction.guild.id);
            let player = client.riffy.players.get(interaction.guild.id);

            if (!player) {
                player = client.riffy.createConnection({
                    guildId: interaction.guild.id,
                    voiceChannel: member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    deaf: true,
                });
                guildData.playerChannelId = interaction.channel.id;
            }

            if (player && typeof player.setVolume === "function") {
                player.setVolume(guildData.volume || 50);
            }

            // Tối ưu nguồn tìm kiếm qua SoundCloud để tránh treo/lỗi từ YouTube
            const searchQuery = query.startsWith("http") ? query : `scsearch:${query}`;
            
            console.log(`[Musicify] Attempting to resolve query: ${searchQuery}`);
            const result = await client.riffy.resolve({
                query: searchQuery,
                requester: interaction.user,
            });

            if (!result) {
                return interaction.editReply({ content: "❌ Không nhận được phản hồi từ hệ thống nhạc (Lavalink Node)." });
            }

            const { loadType, tracks, playlistInfo } = result;
            const embed = new EmbedBuilder().setColor("#2b2d31");

            // 3. Xử lý trường hợp: PLAYLIST
            if (loadType === "playlist" || loadType === "PLAYLIST_LOADED") {
                const duplicates = [];
                const addedTracks = [];

                for (const track of tracks) {
                    track.info.requester = interaction.user;

                    if (isTrackDuplicate(player, track)) {
                        duplicates.push(track.info.title || "Unknown");
                    } else {
                        player.queue.add(track);
                        addedTracks.push(track.info.title || "Unknown");
                    }
                }

                embed.setTitle("✅ Playlist Added")
                     .setDescription(`**Playlist:** ${playlistInfo?.name || "Unknown"}\n**Tracks:** ${addedTracks.length} songs added to queue`);
                
                if (duplicates.length > 0) {
                    embed.addFields({ name: "⚠️ Duplicates Skipped", value: `${duplicates.length} songs already in queue` });
                }

                await interaction.editReply({ embeds: [embed] });
            } 
            
            // 4. Xử lý trường hợp: SINGLE TRACK / SEARCH
            else if (["search", "track", "SEARCH_RESULT", "TRACK_LOADED"].includes(loadType)) {
                const track = tracks?.[0];
                if (!track) {
                    return interaction.editReply({ content: "❌ No results found." });
                }

                if (isTrackDuplicate(player, track)) {
                    embed.setTitle("⚠️ Duplicate Detected")
                         .setDescription(`**Track:** ${track.info.title}\n**Status:** Already in queue or currently playing`);
                    return await interaction.editReply({ embeds: [embed] });
                }

                track.info.requester = interaction.user;
                player.queue.add(track);

                embed.setTitle("✅ Track Added")
                     .addFields(
                         { name: "Title", value: track.info.title || "Unknown", inline: true },
                         { name: "Artist", value: track.info.author || "Unknown", inline: true },
                         { name: "Position", value: `#${player.queue.length} in queue`, inline: true }
                     );
                
                await interaction.editReply({ embeds: [embed] });
            } 
            
            // 5. Không rõ định dạng
            else {
                console.log(`[Musicify] Unhandled loadType: "${loadType}"`);
                return interaction.editReply({ content: `❌ No results found. (loadType: ${loadType})` });
            }

            // Phát nhạc
            if (!player.playing && !player.paused && !player.current) {
                player.play();
            }

        } catch (error) {
            console.error("[Musicify] Play error:", error);
            return interaction.editReply({ content: "❌ An error occurred while searching hoặc hệ thống bot bị crash." });
        }
    },
};
