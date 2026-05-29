const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");
const { getGuildData } = require("../utils/playerStore");

// Hàm bổ trợ kiểm tra trùng lặp bài hát trong hàng chờ
function isTrackDuplicate(player, track) {
    if (!player) return false;
    const currentUri = player.current?.info?.uri;
    const inQueue = player.queue.some(existing => existing.info.uri === track.info.uri);
    return inQueue || currentUri === track.info.uri;
}

// Hàm bổ trợ tạo nhanh giao diện phản hồi (Components V2)
async function sendComponentReply(interaction, content) {
    const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
    );
    return await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
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

        // 1. Kiểm tra filter đầu vào
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

        // Hoãn phản hồi để xử lý tác vụ nặng
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

        player.setVolume(guildData.volume);

        try {
            // Tối ưu nguồn tìm kiếm: Tự động dùng scsearch (SoundCloud) nếu người dùng gõ chữ
            const searchQuery = query.startsWith("http") ? query : `scsearch:${query}`;

            const result = await client.riffy.resolve({
                query: searchQuery,
                requester: interaction.user,
            });

            const { loadType, tracks, playlistInfo } = result;

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

                let content = `### ✅ Playlist Added\n\n**Playlist**\n-# ${playlistInfo.name}\n\n**Tracks**\n-# ${addedTracks.length} songs added to queue`;
                if (duplicates.length > 0) {
                    content += `\n\n⚠️ **Duplicates Skipped**\n-# ${duplicates.length} songs already in queue`;
                }

                await sendComponentReply(interaction, content);
            } 
            
            // 4. Xử lý trường hợp: SINGLE TRACK / SEARCH
            else if (["search", "track", "SEARCH_RESULT", "TRACK_LOADED"].includes(loadType)) {
                const track = tracks[0];
                if (!track) {
                    return interaction.editReply({ content: "❌ No results found." });
                }

                if (isTrackDuplicate(player, track)) {
                    const content = `### ⚠️ Duplicate Detected\n\n**Track**\n-# ${track.info.title}\n\n**Status**\n-# Already in queue or currently playing`;
                    return await sendComponentReply(interaction, content);
                }

                track.info.requester = interaction.user;
                player.queue.add(track);

                const content = `### ✅ Track Added\n\n**Title**\n-# ${track.info.title}\n\n**Artist**\n-# ${track.info.author}\n\n**Position**\n-# #${player.queue.length} in queue`;
                await sendComponentReply(interaction, content);
            } 
            
            // 5. Trường hợp không nhận diện được định dạng trả về từ Lavalink
            else {
                console.log(`[Musicify] Unhandled loadType: "${loadType}"`);
                return interaction.editReply({ content: `❌ No results found. (loadType: ${loadType})` });
            }

            // Kích hoạt phát nhạc nếu player đang đứng im
            if (!player.playing && !player.paused && !player.current) {
                player.play();
            }

        } catch (error) {
            console.error("[Musicify] Play error:", error);
            return interaction.editReply({ content: "❌ An error occurred while searching." });
        }
    },
};
