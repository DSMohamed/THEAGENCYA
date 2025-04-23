const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory of purchased items')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose inventory to view')
        .setRequired(false)),
        
  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const inventory = await economy.getInventory(targetUser.id);
    const shopItems = await economy.getShopItems();
    
    const embed = new EmbedBuilder()
      .setColor('#9933ff')
      .setTitle(`${targetUser.username}'s Inventory`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    
    if (!inventory || inventory.length === 0) {
      embed.setDescription(`${targetUser.username} doesn't have any items yet!\nUse \`/shop\` to browse available items.`);
    } else {
      let itemList = '';
      let totalValue = 0;
      
      // Group duplicate items and count them
      const itemCounts = {};
      inventory.forEach(itemId => {
        itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
      });
      
      // Display each unique item with its count
      for (const [itemId, count] of Object.entries(itemCounts)) {
        const item = shopItems.find(i => i.id === itemId);
        
        if (item) {
          itemList += `**${item.name}** ${count > 1 ? `(x${count})` : ''}\n`;
          itemList += `${item.description || 'No description available'}\n\n`;
          totalValue += item.price * count;
        } else {
          itemList += `**Unknown Item** (${itemId}) ${count > 1 ? `(x${count})` : ''}\n\n`;
        }
      }
      
      embed.setDescription(itemList || 'No items found');
      embed.addFields({ 
        name: 'Total Value', 
        value: `${economy.currency.symbol} ${totalValue.toLocaleString()} ${economy.currency.name}` 
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  },
};