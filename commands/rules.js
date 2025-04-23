const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

// Pre-configured rules content
const RULES_TITLE = "Rules";
const RULES_CONTENT = `Welcome to The Agency To keep things fun and safe for everyone, please follow these rules. Breaking them may lead to warnings, mutes, kicks, or bans. Stay chill and enjoy your time here!
                                     --------------------------
**:one: Be Respectful **– Treat everyone with kindness. No harassment, hate speech, bullying, or toxic behavior.

**:two: No Spamming** – Avoid excessive messages, emojis, mentions, or caps. Keep chat clean and readable.

**:three: Keep It Safe for Work** – No NSFW, explicit, or inappropriate content, including profile pictures and usernames.

**:four: No Self-Promotion** – Do not advertise servers, social media, or personal projects unless allowed by staff.

**:five: Follow Discord's Terms of Service** – Adhere to Discord's Terms and Community Guidelines.

**:six: No Malicious Content** – Do not share links to scams, viruses, hacks, or anything illegal.

**:seven: Use Channels Correctly** – Stick to each channel's topic. Off-topic discussions should go to the appropriate places.

**:eight: Listen to Staff** – Moderators and admins have the final say. Arguing with staff or ignoring warnings may lead to consequences.

**:nine:** ***If anyone uses a role incorrectly (for example, if you're a boy and you use a girl's role for any reason, or vice versa, strict action will be taken against you).***

**:keycap_ten:** ***If you violate any of the rules, you'll first receive a warning, followed by a timeout, and then a kick from the server (depending on whether you violated the rule or made a mistake).***



:bulb: Need help? If you have questions, contact a moderator. Enjoy your stay! :rocket:`;
const RULES_BANNER = "https://i.postimg.cc/J4FLmW7f/Untitled-1.jpg";
const RULES_COLOR = "#fcba03";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Post the server rules with pre-configured formatting")
    // Removed Discord permission requirement so all users can see the command
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Channel to send the rules to (defaults to current channel)"
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

    // Create the rules embed - the content is already properly formatted with line breaks
    const rulesEmbed = new EmbedBuilder()
      .setColor(RULES_COLOR)
      .setTitle(RULES_TITLE)
      .setDescription(RULES_CONTENT)
      .setImage(RULES_BANNER)
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
        .setTitle("✅ Rules Posted")
        .setDescription(`Server rules have been posted to ${channel}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error sending rules embed:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          `Failed to send the rules. Make sure the bot has permission to send messages in ${channel}.`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
