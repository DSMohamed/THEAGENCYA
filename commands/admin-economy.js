const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");
const config = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-economy")
    .setDescription("Admin commands for managing the economy")
    // Removed Discord permission requirement so all users can see the command
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add currency to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add currency to")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of currency to add")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove currency from a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove currency from")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of currency to remove")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user's currency to a specific amount")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to set currency for")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of currency to set")
            .setRequired(true)
            .setMinValue(0)
        )
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
        .setDescription(
          "You do not have permission to use admin economy commands."
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    // Don't allow admins to modify bot balances
    if (targetUser.bot) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Invalid Target")
        .setDescription("You cannot modify a bot's balance.")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    let newBalance;
    let description;

    if (subcommand === "add") {
      // Special permission check for the add subcommand
      const isAuthorizedForAddCommand = config.hasSensitiveCommandPermission(
        interaction.user.id
      );

      if (!isAuthorizedForAddCommand) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Special Permission Denied")
          .setDescription(
            "You are not authorized to add currency. This command is restricted to specific administrators."
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      newBalance = await economy.addBalance(targetUser.id, amount);
      description = `Added ${
        economy.currency.symbol
      } ${amount.toLocaleString()} ${economy.currency.name} to **${
        targetUser.username
      }**'s balance.`;
    } else if (subcommand === "remove") {
      newBalance = await economy.removeBalance(targetUser.id, amount);
      description = `Removed ${
        economy.currency.symbol
      } ${amount.toLocaleString()} ${economy.currency.name} from **${
        targetUser.username
      }**'s balance.`;
    } else if (subcommand === "set") {
      newBalance = await economy.setBalance(targetUser.id, amount);
      description = `Set **${targetUser.username}**'s balance to ${
        economy.currency.symbol
      } ${amount.toLocaleString()} ${economy.currency.name}.`;
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("💰 Balance Updated")
      .setDescription(description)
      .addFields(
        { name: "User", value: `${targetUser.username}`, inline: true },
        {
          name: "New Balance",
          value: `${economy.currency.symbol} ${newBalance.toLocaleString()} ${
            economy.currency.name
          }`,
          inline: true,
        },
        {
          name: "Modified By",
          value: `${interaction.user.username}`,
          inline: true,
        }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // Send to admin privately
    await interaction.editReply({ embeds: [embed], ephemeral: true });

    // Also create a log in public channel if desired
    // You can uncomment the below code to log balance changes publicly
    /*
    const logEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Economy Log')
      .setDescription(`${interaction.user.username} has updated ${targetUser.username}'s balance.`)
      .addFields(
        { name: 'Action', value: subcommand, inline: true },
        { name: 'Amount', value: `${economy.currency.symbol} ${amount.toLocaleString()} ${economy.currency.name}`, inline: true },
        { name: 'New Balance', value: `${economy.currency.symbol} ${newBalance.toLocaleString()} ${economy.currency.name}`, inline: true }
      )
      .setTimestamp();
    
    // You would need to set up a log channel ID in the economy config
    // const logChannelId = await economy.configTable.get('logChannelId');
    // if (logChannelId) {
    //   const logChannel = interaction.guild.channels.cache.get(logChannelId);
    //   if (logChannel) {
    //     logChannel.send({ embeds: [logEmbed] });
    //   }
    // }
    */
  },
};
