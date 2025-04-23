const { EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    // Get welcome configuration for this guild
    const welcomeConfig = await economy.getWelcomeConfig(member.guild.id);

    // Check if welcome is configured and enabled for this guild
    if (!welcomeConfig || !welcomeConfig.enabled) {
      return;
    }

    const channelId = welcomeConfig.channelId;
    const title = welcomeConfig.title;
    const subtitle = welcomeConfig.subtitle;
    const welcomeMessage = welcomeConfig.message.replace(
      "{user}",
      `<@${member.id}>`
    );
    const logoUrl = welcomeConfig.logoUrl;

    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      // Create the golden embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor("#FFD700") // Gold color code
        .setTitle(title)
        .setDescription(`${subtitle}\n\nHello ${welcomeMessage}`)
        .setTimestamp();

      // Add thumbnail (logo) if available
      if (logoUrl) {
        welcomeEmbed.setThumbnail(logoUrl);
      }

      channel.send({ embeds: [welcomeEmbed] });
    }
  },
};
