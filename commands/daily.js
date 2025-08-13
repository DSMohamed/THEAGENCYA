const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

// 24 hours in milliseconds
const COOLDOWN = 12 * 60 * 60 * 1000;
// Daily reward amount - random between 1K to 3K
const getRandomReward = () =>
  Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;

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

      // Format the last daily time in a readable format
      const lastDailyDate = new Date(lastDaily);
      const formattedLastDaily = lastDailyDate.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Daily Reward - Cooldown")
        .setDescription(
          `You've already claimed your daily reward!\n**Last claimed:** ${formattedLastDaily}\nCome back in **${hours}h ${minutes}m**.`
        );

      return interaction.editReply({ embeds: [embed] });
    }

    // Add reward and update last daily timestamp
    const reward = getRandomReward();
    const newBalance = await economy.addBalance(userId, reward);
    await economy.setLastDaily(userId, now);

    // Store the username in the database for the leaderboard
    await economy.storeUsername(userId, interaction.user.username);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("Daily Reward Claimed!")
      .setDescription(
        `You claimed your daily reward of ${economy.currency.symbol} ${reward} ${economy.currency.name}!`
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
