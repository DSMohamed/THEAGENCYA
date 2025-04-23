const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Send a customized rules embed with a banner")
    // Removed Discord permission requirement so all users can see the command
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Title of the embed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Description or rules content")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("banner_url")
        .setDescription("URL of the banner image to display")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Color of the embed (hex code or basic color name)")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Channel to send the embed to (defaults to current channel)"
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Check if user has admin permission
    const hasPermission =
      interaction.user.id === interaction.guild.ownerId ||
      (await economy.hasAdminPermission(interaction.member));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Permission Denied")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    // Get command options
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const bannerUrl = interaction.options.getString("banner_url");
    const color = interaction.options.getString("color") || "#0099ff";
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    // Process description to add proper line breaks
    // This adds proper spacing between numbered rules
    let formattedDescription = description;

    // Add double line breaks after numbered emoji points if they don't already exist
    formattedDescription = formattedDescription.replace(
      /(\*\*[0-9]️⃣[^*]+\*\*[^\n]*\n)(?!\n)/g,
      "$1\n"
    );

    // Also add spacing after bullet points
    formattedDescription = formattedDescription.replace(
      /(💡[^\n]*\n)(?!\n)/g,
      "$1\n"
    );

    // Create the rules embed
    const rulesEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(formattedDescription)
      .setImage(bannerUrl)
      .setFooter({
        text: `Posted by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    try {
      // Send the embed to the specified channel
      await channel.send({ embeds: [rulesEmbed] });

      // Confirm to the admin that the embed was sent
      const confirmEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Embed Sent")
        .setDescription(`Your rules embed has been sent to ${channel}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error sending rules embed:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          `Failed to send the embed. Make sure the bot has permission to send messages in ${channel} and the banner URL is valid.`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
