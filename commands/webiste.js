const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

// Define your constants here
const RULES_COLOR = "#fcba03"; // Example color
const RULES_TITLE = "Official Website";
const RULES_CONTENT = `Visit our official site at https://theagencybot.netlify.app/ 

  Visit our official Discrod Server at https://discord.gg/3qQzrQ2YPw/`;

const RULES_BANNER = "https://i.postimg.cc/J4FLmW7f/Untitled-1.jpg";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("website")
    .setDescription("official THEAGENCY bot website"),

  async execute(interaction) {
    const websiteEmbed = new EmbedBuilder()
      .setColor(RULES_COLOR)
      .setTitle(RULES_TITLE)
      .setDescription(RULES_CONTENT)
      .setImage(RULES_BANNER)
      .setFooter({
        text: `Posted by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ embeds: [websiteEmbed] });
  },
};
