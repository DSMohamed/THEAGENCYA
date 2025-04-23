const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete a specified number of messages from the channel")
    // Removed Discord permission requirement so all users can see the command
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
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

    const amount = interaction.options.getInteger("amount");

    try {
      // Fetch messages to delete
      const messages = await interaction.channel.messages.fetch({
        limit: amount,
      });

      // Check for messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const filteredMessages = messages.filter(
        (message) => message.createdTimestamp > twoWeeksAgo
      );

      // Check if any messages are too old
      if (filteredMessages.size < messages.size) {
        const oldMessages = messages.size - filteredMessages.size;
        const warningEmbed = new EmbedBuilder()
          .setColor("#ffaa00")
          .setTitle("⚠️ Some Messages Too Old")
          .setDescription(
            `${oldMessages} message(s) are older than 14 days and cannot be bulk deleted.`
          )
          .setTimestamp();

        await interaction.editReply({
          embeds: [warningEmbed],
          ephemeral: true,
        });
      }

      // If no valid messages to delete
      if (filteredMessages.size === 0) {
        const noMessagesEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ No Messages Deleted")
          .setDescription(
            "There are no messages that can be deleted (all messages are older than 14 days)."
          )
          .setTimestamp();

        return interaction.editReply({
          embeds: [noMessagesEmbed],
          ephemeral: true,
        });
      }

      // Delete messages
      const deletedCount = await interaction.channel.bulkDelete(
        filteredMessages,
        true
      );

      // Success message
      const successEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Messages Deleted")
        .setDescription(`Successfully deleted ${deletedCount.size} message(s).`)
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error deleting messages:", error);

      // Error message
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          "An error occurred while trying to delete messages. Make sure the bot has permission to manage messages in this channel."
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
