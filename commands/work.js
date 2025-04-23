const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

// 1 hour cooldown in milliseconds
const COOLDOWN = 60 * 60 * 1000;
// Min and max reward amounts
const MIN_REWARD = 50;
const MAX_REWARD = 200;

// List of possible jobs
const jobs = [
  {
    name: "Developer",
    messages: [
      "You fixed a critical bug in a client's website",
      "You developed a new app feature",
      "You optimized database queries",
    ],
  },
  {
    name: "Chef",
    messages: [
      "You cooked a delicious meal for customers",
      "You catered a big event",
      "You created a new signature dish",
    ],
  },
  {
    name: "Driver",
    messages: [
      "You completed several deliveries",
      "You drove passengers across town",
      "You transported valuable goods",
    ],
  },
  {
    name: "Streamer",
    messages: [
      "You hosted a successful live stream",
      "You got a bunch of new subscribers",
      "You landed a sponsorship deal",
    ],
  },
  {
    name: "Teacher",
    messages: [
      "You taught an engaging class",
      "You graded all the homework",
      "You helped a struggling student",
    ],
  },
  {
    name: "Gardener",
    messages: [
      "You landscaped a beautiful garden",
      "You planted trees in the park",
      "You maintained the community garden",
    ],
  },
  {
    name: "Artist",
    messages: [
      "You sold one of your paintings",
      "You completed a commission",
      "You hosted a successful art workshop",
    ],
  },
  {
    name: "Mechanic",
    messages: [
      "You fixed a broken engine",
      "You serviced several vehicles",
      "You restored a classic car",
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work to earn some currency"),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const lastWork = await economy.getLastWork(userId);
    const now = Date.now();

    // Check if user is on cooldown
    if (lastWork && now - lastWork < COOLDOWN) {
      const timeLeft = COOLDOWN - (now - lastWork);
      const minutes = Math.floor(timeLeft / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Work - Cooldown")
        .setDescription(
          `You're too tired to work again!\nTake a break and come back in **${minutes}m ${seconds}s**.`
        );

      return interaction.editReply({ embeds: [embed] });
    }

    // Generate random reward
    const reward =
      Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;

    // Select random job and message
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const message =
      job.messages[Math.floor(Math.random() * job.messages.length)];

    // Add reward and update last work timestamp
    const newBalance = await economy.addBalance(userId, reward);
    await economy.setLastWork(userId, now);

    // Store the username in the database for the leaderboard
    await economy.storeUsername(userId, interaction.user.username);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle(`You worked as a ${job.name}`)
      .setDescription(
        `${message} and earned ${economy.currency.symbol} ${reward} ${economy.currency.name}!`
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
