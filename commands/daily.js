const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

// 24 hours in milliseconds
const COOLDOWN = 24 * 60 * 60 * 1000;
// Daily reward amount
const REWARD = 500;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward"),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const lastDaily = await economy.getLastDaily(userId);
    const now = Date.now();

    // Check if user is on cooldown
    if (lastDaily && now - lastDaily < COOLDOWN) {
      const timeLeft = COOLDOWN - (now - lastDaily);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Daily Reward - Cooldown")
        .setDescription(
          `You've already claimed your daily reward!\nCome back in **${hours}h ${minutes}m**.`
        );

      return interaction.editReply({ embeds: [embed] });
    }

    // Add reward and update last daily timestamp
    const newBalance = await economy.addBalance(userId, REWARD);
    await economy.setLastDaily(userId, now);

    // Store the username in the database for the leaderboard
    await economy.storeUsername(userId, interaction.user.username);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("Daily Reward Claimed!")
      .setDescription(
        `You claimed your daily reward of ${economy.currency.symbol} ${REWARD} ${economy.currency.name}!`
      )
      .addFields({
        name: "New Balance",
        value: `${economy.currency.symbol} ${newBalance.toLocaleString()} ${
          economy.currency.name
        }`,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
