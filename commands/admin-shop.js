const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-shop")
    .setDescription("Admin commands for managing the shop")
    // Removed Discord permission requirement so all users can see the command
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a new item to the shop")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the item")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("price")
            .setDescription("Price of the item")
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Description of the item")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove an item from the shop")
        .addStringOption((option) =>
          option
            .setName("item_id")
            .setDescription("ID of the item to remove")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all items in the shop with their IDs")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Remove all items from the shop")
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
        .setDescription("You do not have permission to manage the shop.")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const name = interaction.options.getString("name");
      const price = interaction.options.getInteger("price");
      const description = interaction.options.getString("description");

      // Add item to the shop
      const newItem = await economy.addShopItem(name, price, description);

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Item Added")
        .setDescription(`New item **${name}** has been added to the shop.`)
        .addFields(
          { name: "Name", value: name, inline: true },
          {
            name: "Price",
            value: `${economy.currency.symbol} ${price.toLocaleString()}`,
            inline: true,
          },
          { name: "Description", value: description },
          { name: "Item ID", value: newItem.id, inline: true }
        )
        .setFooter({ text: "Users can purchase this item with /buy command" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "remove") {
      const itemId = interaction.options.getString("item_id");

      // Get shop items
      const shopItems = await economy.getShopItems();

      // Find the item by ID
      const itemIndex = shopItems.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Item Not Found")
          .setDescription(`Could not find an item with ID: ${itemId}`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      // Use the proper utility method to remove the item
      const result = await economy.removeShopItem(itemId);

      if (!result.removed) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Item Not Found")
          .setDescription(`Could not find an item with ID: ${itemId}`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      // Get the removed item from the result
      const item = result.item;

      const embed = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle("🗑️ Item Removed")
        .setDescription(`Item **${item.name}** has been removed from the shop.`)
        .addFields(
          { name: "Item ID", value: item.id, inline: true },
          {
            name: "Price",
            value: `${economy.currency.symbol} ${item.price.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "clear") {
      const shopItems = await economy.getShopItems();

      if (shopItems.length === 0) {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("🛒 Shop Items")
          .setDescription("There are no items in the shop to remove.")
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      // Show confirmation message
      const confirmEmbed = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle("⚠️ Confirmation")
        .setDescription(
          `Are you sure you want to remove all ${shopItems.length} items from the shop?`
        )
        .setFooter({ text: "This action cannot be undone." })
        .setTimestamp();

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm_clear_shop")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cancel_clear_shop")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary)
      );

      const response = await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmRow],
        ephemeral: true,
      });

      // Create a collector for button interactions
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = response.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "confirm_clear_shop") {
          // Remove all items
          const count = await economy.removeAllShopItems();

          const successEmbed = new EmbedBuilder()
            .setColor("#ff9900")
            .setTitle("🗑️ Shop Cleared")
            .setDescription(
              `Successfully removed all ${count} items from the shop.`
            )
            .setTimestamp();

          await i.update({ embeds: [successEmbed], components: [] });
        } else if (i.customId === "cancel_clear_shop") {
          const cancelEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("❓ Action Cancelled")
            .setDescription("Shop items were not removed.")
            .setTimestamp();

          await i.update({ embeds: [cancelEmbed], components: [] });
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("⏱️ Timed Out")
            .setDescription("No response received, action cancelled.")
            .setTimestamp();

          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: [],
          });
        }
      });

      return;
    } else if (subcommand === "list") {
      const shopItems = await economy.getShopItems();

      if (shopItems.length === 0) {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("🛒 Shop Items")
          .setDescription("There are no items in the shop.")
          .setFooter({ text: "Add items with /admin-shop add" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      // Create a detailed list of all items with their IDs
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("🛒 Shop Items")
        .setDescription(`There are ${shopItems.length} items in the shop:`)
        .setFooter({
          text: "Use item IDs with /admin-shop remove to remove items",
        })
        .setTimestamp();

      for (const item of shopItems) {
        embed.addFields({
          name: `${item.name} (${
            economy.currency.symbol
          } ${item.price.toLocaleString()})`,
          value: `**ID:** ${item.id}\n**Description:** ${
            item.description || "No description"
          }`,
        });
      }

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  },

  async autocomplete(interaction) {
    // Get shop items for autocomplete
    const shopItems = await economy.getShopItems();
    const focusedValue = interaction.options.getFocused().toLowerCase();

    // Filter items based on what the user has typed
    const filtered = shopItems.filter(
      (item) =>
        item.name.toLowerCase().includes(focusedValue) ||
        item.id.toLowerCase().includes(focusedValue)
    );

    // Return up to 25 matching choices
    await interaction.respond(
      filtered.slice(0, 25).map((item) => ({
        name: `${item.name} (${item.id})`,
        value: item.id,
      }))
    );
  },
};
