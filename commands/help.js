const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Display all commands and how to use them")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Command category to show help for")
        .setRequired(false)
        .addChoices(
          { name: "Economy", value: "economy" },
          { name: "Admin", value: "admin" },
          { name: "Moderation", value: "moderation" },
          { name: "All", value: "all" }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true }); // Make help command response ephemeral

      const category = interaction.options.getString("category") || "all";
      console.log(`Help command executed with category: ${category}`);

      // Check admin permissions for showing admin commands
      const isAdmin =
        interaction.user.id === interaction.guild.ownerId ||
        (await economy.hasAdminPermission(interaction.member));

      console.log(
        `User ${interaction.user.tag} has admin permissions: ${isAdmin}`
      );

      // Create array of embeds to send
      const embeds = [];

      // Main help embed
      const mainEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("📖 Command Help")
        .setDescription("Select a category to see commands:")
        .setThumbnail(
          interaction.client.user.displayAvatarURL({ dynamic: true })
        )
        .addFields({
          name: "Available Categories",
          value:
            "💰 **Economy** - `/help economy`\n" +
            (isAdmin ? "🛡️ **Admin** - `/help admin`\n" : "") +
            (isAdmin ? "🛠️ **Moderation** - `/help moderation`\n" : "") +
            "📋 **All Commands** - `/help all`",
        })
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
        })
        .setTimestamp();

      embeds.push(mainEmbed);

      // ECONOMY COMMANDS EMBED
      if (category === "economy" || category === "all") {
        const economyEmbed = new EmbedBuilder()
          .setColor("#ffd700") // Gold color
          .setTitle("💰 Economy Commands")
          .addFields(
            {
              name: "Currency Commands",
              value:
                "`/balance [@user]` - Check your balance or another user's balance\n" +
                "`/daily` - Claim your daily reward of coins\n" +
                "`/work` - Work to earn coins (1 hour cooldown)\n" +
                "`/transfer [@user] [amount]` - Send coins to another user",
            },
            {
              name: "Shop Commands",
              value:
                "`/shop` - Browse the item shop\n" +
                "`/buy [item]` - Purchase an item from the shop\n" +
                "`/inventory [@user]` - View your inventory or another user's inventory\n" +
                "`/leaderboard [limit]` - View the richest users",
            },
            {
              name: "Economy Examples",
              value:
                "- Check your balance: `/balance`\n" +
                "- Check someone else's balance: `/balance @Username`\n" +
                "- Claim daily reward: `/daily`\n" +
                "- Work to earn coins: `/work`\n" +
                "- Send coins to a friend: `/transfer @Username 100`\n" +
                "- Buy an item: `/buy Sword`",
            }
          );

        embeds.push(economyEmbed);
      }

      // MODERATION COMMANDS EMBED
      if (isAdmin && (category === "moderation" || category === "all")) {
        const moderationEmbed = new EmbedBuilder()
          .setColor("#ff5555") // Red color
          .setTitle("🛠️ Moderation Commands")
          .addFields(
            {
              name: "Basic Moderation",
              value:
                "`/ban [@user] [reason]` - Permanently ban a user from the server\n" +
                "`/kick [@user] [reason]` - Kick a user from the server\n" +
                "`/timeout [@user] [duration] [reason]` - Timeout a user for a specified duration\n" +
                "`/clear [amount]` - Delete a specified number of messages from the channel\n" +
                "`/clear-all` - Delete all messages in the channel (with confirmation)",
            },
            {
              name: "Warning System",
              value:
                "`/warn [@user] [reason]` - Issue a warning to a user\n" +
                "`/warnings view [@user]` - View all warnings for a user\n" +
                "`/warnings remove [@user] [warning_id]` - Remove a specific warning\n" +
                "`/warnings clear [@user]` - Clear all warnings for a user",
            },
            {
              name: "Moderation Examples",
              value:
                "- Ban a user: `/ban @Username Breaking server rules`\n" +
                "- Kick a user: `/kick @Username Inappropriate behavior`\n" +
                "- Timeout a user: `/timeout @Username 1h Spamming in chat`\n" +
                "- Delete messages: `/clear 50`\n" +
                "- Clear all messages: `/clear-all`",
            }
          );

        embeds.push(moderationEmbed);
      }

      // ADMIN COMMANDS EMBED
      if (isAdmin && (category === "admin" || category === "all")) {
        // Admin Role commands embed
        const adminRolesEmbed = new EmbedBuilder()
          .setColor("#5865f2") // Discord blue
          .setTitle("🛡️ Admin Commands - Roles")
          .addFields(
            {
              name: "Role Management",
              value:
                "`/admin-roles add [@role]` - Add a role to admin roles\n" +
                "`/admin-roles remove [@role]` - Remove a role from admin roles\n" +
                "`/admin-roles list` - List all admin roles\n" +
                "`/admin-roles set-display [@role]` - Set which role can see admin commands\n" +
                "`/admin-roles get-display` - See which role can currently see admin commands\n" +
                "`/admin-roles remove-display` - Remove visibility restrictions (all can see commands)",
            },
            {
              name: "Role Examples",
              value:
                "- Add admin role: `/admin-roles add @Moderator`\n" +
                "- Set display role: `/admin-roles set-display @Staff`\n" +
                "- Remove display role: `/admin-roles remove-display`",
            }
          );

        embeds.push(adminRolesEmbed);

        // Admin Economy commands embed
        const adminEconomyEmbed = new EmbedBuilder()
          .setColor("#5865f2") // Discord blue
          .setTitle("🛡️ Admin Commands - Economy & Shop")
          .addFields(
            {
              name: "Economy Management",
              value:
                "`/admin-economy add [@user] [amount]` - Add coins to a user (restricted to specific authorized IDs)\n" +
                "`/admin-economy remove [@user] [amount]` - Remove coins from a user\n" +
                "`/admin-economy set [@user] [amount]` - Set a user's balance",
            },
            {
              name: "Shop Management",
              value:
                "`/admin-shop add [name] [price] [description]` - Add an item to the shop\n" +
                "`/admin-shop remove [item_id]` - Remove an item from the shop\n" +
                "`/admin-shop list` - List all shop items with their IDs",
            },
            {
              name: "Examples",
              value:
                "- Give a user coins: `/admin-economy add @Username 1000`\n" +
                '- Add shop item: `/admin-shop add "Magic Wand" 2000 "A powerful magical wand"`\n' +
                "- View shop items with IDs: `/admin-shop list`",
            }
          );

        embeds.push(adminEconomyEmbed);

        // Admin Embeds commands
        const adminEmbedsEmbed = new EmbedBuilder()
          .setColor("#5865f2") // Discord blue
          .setTitle("🛡️ Admin Commands - Server Embeds")
          .addFields(
            {
              name: "Embed Commands",
              value:
                "`/embed [title] [description] [banner_url] [color] [channel]` - Send a custom rules embed with banner\n" +
                "`/rules [channel]` - Post pre-configured server rules with formatting\n" +
                "`/rules-ar [channel]` - Post pre-configured server rules in Arabic\n" +
                "`/info [channel]` - Post pre-configured server information with formatting",
            },
            {
              name: "Examples",
              value:
                '- Create custom embed: `/embed "Server Rules" "1. Be respectful\n2. No spamming" https://example.com/banner.png #ff0000`\n' +
                "- Post server rules: `/rules #rules-channel`\n" +
                "- Post Arabic rules: `/rules-ar #rules-channel`\n" +
                "- Post server info: `/info #info-channel`",
            }
          );

        embeds.push(adminEmbedsEmbed);
      } else if (category === "admin" && !isAdmin) {
        // If user is not admin but requested admin commands
        const noPermEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("🛡️ Admin Commands")
          .setDescription("You do not have permission to view admin commands.")
          .setTimestamp();

        embeds.push(noPermEmbed);
      }

      // Send embeds (maximum 10 allowed by Discord)
      await interaction.editReply({ embeds: embeds.slice(0, 10) });
      console.log("Help command completed successfully");
    } catch (error) {
      console.error(`Error in help command: ${error}`);

      // Try to respond with an error message
      try {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Error")
          .setDescription(
            `There was an error while executing this command: ${error.message}`
          )
          .setTimestamp();

        // Check if the interaction has been deferred
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            embeds: [errorEmbed],
            ephemeral: true,
          });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (followUpError) {
        console.error(`Failed to send error response: ${followUpError}`);
      }
    }
  },
};
