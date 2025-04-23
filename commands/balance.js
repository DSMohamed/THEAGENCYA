const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance or another user's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose balance to check")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user") || interaction.user;
    const balance = await economy.getBalance(targetUser.id);

    // Store the username in the database for the leaderboard
    await economy.storeUsername(targetUser.id, targetUser.username);

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`${targetUser.username}'s Balance`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields({
        name: "Balance",
        value: `${economy.currency.symbol} ${balance.toLocaleString()} ${
          economy.currency.name
        }`,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
