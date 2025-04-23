const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear-all")
    .setDescription("Delete all messages in the channel (with confirmation)"),

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

    // Create confirmation message with buttons
    const confirmEmbed = new EmbedBuilder()
      .setColor("#ff9900")
      .setTitle("⚠️ Clear All Messages")
      .setDescription(
        "**WARNING:** This will attempt to delete ALL messages in this channel.\n\n" +
        "- Messages older than 14 days cannot be bulk deleted due to Discord limitations\n" +
        "- This action cannot be undone\n" +
        "- This may take some time for channels with many messages\n\n" +
        "Are you sure you want to proceed?"
      )
      .setFooter({ text: "This confirmation will expire in 30 seconds" })
      .setTimestamp();

    // Create confirm/cancel buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm-clear")
      .setLabel("Yes, Clear All Messages")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel-clear")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder().addComponents(
      cancelButton,
      confirmButton
    );

    // Send confirmation message
    const confirmMessage = await interaction.editReply({
      embeds: [confirmEmbed],
      components: [actionRow],
      ephemeral: true,
    });

    try {
      // Create collector for button interactions
      const collector = confirmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000, // 30 seconds
      });

      // Handle button interactions
      collector.on("collect", async (buttonInteraction) => {
        // Verify it's the same user
        if (buttonInteraction.user.id !== interaction.user.id) {
          return buttonInteraction.reply({
            content: "You cannot use these buttons.",
            ephemeral: true,
          });
        }

        // Handle cancel button
        if (buttonInteraction.customId === "cancel-clear") {
          const cancelEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("🛑 Operation Cancelled")
            .setDescription("Channel clearing has been cancelled.")
            .setTimestamp();

          collector.stop();
          return buttonInteraction.update({
            embeds: [cancelEmbed],
            components: [],
          });
        }

        // Handle confirm button
        if (buttonInteraction.customId === "confirm-clear") {
          collector.stop();
          
          // Update message to show progress
          const progressEmbed = new EmbedBuilder()
            .setColor("#ffaa00")
            .setTitle("⏳ Clearing Messages")
            .setDescription("Deleting messages... This may take a while.")
            .setTimestamp();

          await buttonInteraction.update({
            embeds: [progressEmbed],
            components: [],
          });

          // Begin deletion process
          let totalDeleted = 0;
          let oldMessagesCount = 0;
          let batchesProcessed = 0;
          let canContinue = true;

          const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

          // Loop until there are no more messages to delete or an error occurs
          while (canContinue) {
            try {
              // Fetch messages in batches of 100 (Discord limitation)
              const messages = await interaction.channel.messages.fetch({
                limit: 100,
              });

              // Stop if no messages left
              if (messages.size === 0) {
                canContinue = false;
                break;
              }

              // Filter messages newer than 14 days
              const filteredMessages = messages.filter(
                (message) => message.createdTimestamp > twoWeeksAgo
              );

              // Count old messages
              oldMessagesCount += messages.size - filteredMessages.size;

              // Stop if no valid messages to delete
              if (filteredMessages.size === 0) {
                canContinue = false;
                break;
              }

              // Delete the batch of messages
              const deleted = await interaction.channel.bulkDelete(
                filteredMessages,
                true
              );

              totalDeleted += deleted.size;
              batchesProcessed++;

              // Update progress every 5 batches or when we're done
              if (batchesProcessed % 5 === 0) {
                const updatedEmbed = new EmbedBuilder()
                  .setColor("#ffaa00")
                  .setTitle("⏳ Clearing Messages")
                  .setDescription(
                    `Deleting messages... ${totalDeleted} deleted so far.\nThis may take a while.`
                  )
                  .setTimestamp();

                await interaction.editReply({ embeds: [updatedEmbed] });
              }
            } catch (error) {
              console.error("Error in clear-all loop:", error);
              canContinue = false;

              // If we hit an error but already deleted some messages, don't treat as complete failure
              if (totalDeleted === 0) {
                const errorEmbed = new EmbedBuilder()
                  .setColor("#ff0000")
                  .setTitle("❌ Error")
                  .setDescription(
                    "An error occurred while trying to delete messages. Make sure the bot has permission to manage messages in this channel."
                  )
                  .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
              }
            }
          }

          // Create completion embed
          let resultEmbed;
          if (totalDeleted > 0) {
            resultEmbed = new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Channel Cleared")
              .setDescription(
                `Successfully deleted ${totalDeleted} messages.` +
                (oldMessagesCount > 0
                  ? `\n\n⚠️ ${oldMessagesCount} messages were skipped because they were older than 14 days and cannot be bulk deleted due to Discord limitations.`
                  : "")
              )
              .setFooter({ text: `Requested by ${interaction.user.username}` })
              .setTimestamp();
          } else if (oldMessagesCount > 0) {
            resultEmbed = new EmbedBuilder()
              .setColor("#ff9900")
              .setTitle("⚠️ No Messages Deleted")
              .setDescription(
                `No messages were deleted because all ${oldMessagesCount} messages in this channel are older than 14 days and cannot be bulk deleted due to Discord limitations.`
              )
              .setFooter({ text: `Requested by ${interaction.user.username}` })
              .setTimestamp();
          } else {
            resultEmbed = new EmbedBuilder()
              .setColor("#0099ff")
              .setTitle("ℹ️ No Messages to Delete")
              .setDescription("There were no messages to delete in this channel.")
              .setFooter({ text: `Requested by ${interaction.user.username}` })
              .setTimestamp();
          }

          await interaction.editReply({ embeds: [resultEmbed] });
        }
      });

      // Handle collector end (timeout)
      collector.on("end", async (collected, reason) => {
        if (reason === "time" && collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("⏱️ Confirmation Timed Out")
            .setDescription("Command cancelled due to timeout.")
            .setTimestamp();

          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: [],
          });
        }
      });
    } catch (error) {
      console.error("Error in clear-all command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          "An unexpected error occurred while processing this command."
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], components: [] });
    }
  },
};