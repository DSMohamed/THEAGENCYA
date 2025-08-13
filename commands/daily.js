const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");
const admin = require("firebase-admin");

// 12 hours in milliseconds (matching web component)
const COOLDOWN = 12 * 60 * 60 * 1000;

// Helper function to format time remaining
function formatTimeRemaining(milliseconds) {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return "Less than 1 minute";
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward (resets every 12 hours)"),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const lastDaily = await economy.getLastDaily(userId);
    const now = Date.now();

    // Debug logging for cooldown check
    console.log(`[DEBUG] Daily command for user ${userId}:`, {
      lastDaily,
      now,
      timeDifference: now - lastDaily,
      cooldown: COOLDOWN,
      isOnCooldown: lastDaily && now - lastDaily < COOLDOWN,
    });

    // Check if user is on cooldown
    if (lastDaily && now - lastDaily < COOLDOWN) {
      const timeLeft = COOLDOWN - (now - lastDaily);
      const formattedTime = formatTimeRemaining(timeLeft);

      console.log(`[DEBUG] User on cooldown, time left:`, {
        timeLeft,
        formattedTime,
        hours: Math.floor(timeLeft / (60 * 60 * 1000)),
        minutes: Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000)),
      });

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Daily Reward - Cooldown")
        .setDescription(
          `You've already claimed your daily reward!\nCome back in **${formattedTime}**.`
        )
        .setFooter({ text: "Daily rewards reset every 12 hours" });

      return interaction.editReply({ embeds: [embed] });
    }

    console.log(`[DEBUG] User can claim daily reward, proceeding...`);

    // Random daily reward between 1000-3000 (matching web component)
    const dailyAmount = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;

    // Add reward and update last daily timestamp
    // Temporarily using Date.now() to test cooldown functionality
    const newBalance = await economy.addBalance(userId, dailyAmount);
    await economy.setLastDaily(userId, now);

    console.log(`[DEBUG] Stored lastDaily timestamp:`, now);

    // Store the username in the database for the leaderboard
    await economy.storeUsername(userId, interaction.user.username);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("🎉 Daily Reward Claimed!")
      .setDescription(
        `You claimed your daily reward of ${
          economy.currency.symbol
        } **${dailyAmount.toLocaleString()}** ${economy.currency.name}!`
      )
      .addFields(
        {
          name: "💰 New Balance",
          value: `${
            economy.currency.symbol
          } **${newBalance.toLocaleString()}** ${economy.currency.name}`,
          inline: true,
        },
        {
          name: "⏰ Reset Time",
          value: "12 hours",
          inline: true,
        },
        {
          name: "🎯 Reward Type",
          value: "Random (1000-3000 coins)",
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: "Daily rewards reset every 12 hours" });

    await interaction.editReply({ embeds: [embed] });
  },
};
