const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the shop')
    .addStringOption(option => 
      option.setName('item')
        .setDescription('The name of the item to purchase')
        .setRequired(true)
        .setAutocomplete(true)),
    
  async execute(interaction) {
    await interaction.deferReply();
    
    const userId = interaction.user.id;
    const itemName = interaction.options.getString('item');
    
    // Get user's balance
    const balance = await economy.getBalance(userId);
    
    // Get shop items
    const shopItems = await economy.getShopItems();
    
    // Find the requested item
    const item = shopItems.find(i => 
      i.name.toLowerCase() === itemName.toLowerCase() || 
      i.id.toLowerCase() === itemName.toLowerCase()
    );
    
    // If item doesn't exist
    if (!item) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Item Not Found')
        .setDescription(`Could not find an item called "${itemName}" in the shop.`);
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Check if user has enough currency
    if (balance < item.price) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Insufficient Funds')
        .setDescription(`You don't have enough ${economy.currency.name} to buy this item!\n` +
          `Item price: ${economy.currency.symbol} ${item.price.toLocaleString()}\n` +
          `Your balance: ${economy.currency.symbol} ${balance.toLocaleString()}`)
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Deduct cost and add item to inventory
    const newBalance = await economy.removeBalance(userId, item.price);
    await economy.addItemToInventory(userId, item.id);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Item Purchased')
      .setDescription(`You purchased **${item.name}** for ${economy.currency.symbol} ${item.price.toLocaleString()} ${economy.currency.name}!`)
      .addFields(
        { name: 'Item Description', value: item.description || 'No description available' },
        { name: 'New Balance', value: `${economy.currency.symbol} ${newBalance.toLocaleString()} ${economy.currency.name}` }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  },
  
  async autocomplete(interaction) {
    // Get shop items for autocomplete
    const shopItems = await economy.getShopItems();
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    // Filter items based on what the user has typed
    const filtered = shopItems.filter(item => 
      item.name.toLowerCase().includes(focusedValue) || 
      item.id.toLowerCase().includes(focusedValue)
    );
    
    // Return up to 25 matching choices
    await interaction.respond(
      filtered.slice(0, 25).map(item => ({
        name: `${item.name} (${economy.currency.symbol} ${item.price})`,
        value: item.name
      }))
    );
  },
};