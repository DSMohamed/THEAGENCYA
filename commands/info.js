const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

// Pre-configured info content
const INFO_TITLE = "Info";
const INFO_CONTENT = `Infos Section
Welcome to The Agency check the following infos
---------------------
1️⃣- go to ⁠ <#1355138015709626386> ・verification to Verify your self

2️⃣- go to ⁠ <#1353978889373745152> ・rules to check the Rules

3️⃣- go to <#1353124100494856243> for support`;
const INFO_BANNER = "https://i.postimg.cc/j2FdGwk9/Untitled-2.jpg";
const INFO_COLOR = "#fcba03";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Post server information with pre-configured formatting")
    // Removed Discord permission requirement so all users can see the command
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Channel to send the info to (defaults to current channel)"
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

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    // Process description to add proper line breaks
    // This adds proper spacing between numbered points
    let formattedContent = INFO_CONTENT;

    // Create the info embed - the content is already properly formatted with line breaks
    const infoEmbed = new EmbedBuilder()
      .setColor(INFO_COLOR)
      .setTitle(INFO_TITLE)
      .setDescription(formattedContent)
      .setImage(INFO_BANNER)
      .setFooter({
        text: `Posted by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    try {
      // Send the embed to the specified channel
      await channel.send({ embeds: [infoEmbed] });

      // Confirm to the admin that the embed was sent
      const confirmEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Info Posted")
        .setDescription(`Server information has been posted to ${channel}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error sending info embed:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          `Failed to send the info. Make sure the bot has permission to send messages in ${channel}.`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
