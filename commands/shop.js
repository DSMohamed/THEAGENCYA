const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const economy = require("../utils/economy");

// Default shop items if none exist in the database
const defaultItems = [
  {
    id: "sword",
    name: "Sword",
    price: 1000,
    description: "A sharp sword for adventures",
  },
  {
    id: "shield",
    name: "Shield",
    price: 800,
    description: "Protects you from attacks",
  },
  {
    id: "potion",
    name: "Health Potion",
    price: 500,
    description: "Restores health in battles",
  },
  {
    id: "trophy",
    name: "Golden Trophy",
    price: 5000,
    description: "A symbol of wealth and status",
  },
  {
    id: "fishing_rod",
    name: "Fishing Rod",
    price: 1200,
    description: "Catch fish for food or profit",
  },
  {
    id: "vip",
    name: "VIP Status",
    price: 10000,
    description: "Exclusive perks and recognition",
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse the shop for items to purchase"),

  async execute(interaction) {
    await interaction.deferReply();

    // Get shop items from database or use defaults
    let shopItems = await economy.getShopItems();

    // If no items exist, add default items
    if (!shopItems || shopItems.length === 0) {
      for (const item of defaultItems) {
        await economy.addShopItem(item.name, item.price, item.description);
      }
      shopItems = await economy.getShopItems();
    }

    // Create shop embed
    const embed = new EmbedBuilder()
      .setColor("#00aaff")
      .setTitle("🛒 Item Shop")
      .setDescription("Use `/buy [item name]` to purchase an item")
      .setTimestamp();

    // Add each item to the embed
    shopItems.forEach((item) => {
      embed.addFields({
        name: `${item.name} - ${
          economy.currency.symbol
        } ${item.price.toLocaleString()}`,
        value: item.description || "No description available",
      });
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
