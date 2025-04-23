const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the richest users')
    .addIntegerOption(option => 
      option.setName('limit')
        .setDescription('Number of users to display (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),
        
  async execute(interaction) {
    await interaction.deferReply();
    
    const limit = interaction.options.getInteger('limit') || 10;
    const leaderboard = await economy.getLeaderboard(limit);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#ffd700') // Gold color
      .setTitle('💰 Economy Leaderboard 💰')
      .setDescription(`Top ${limit} richest users`)
      .setTimestamp();
    
    if (leaderboard.length === 0) {
      embed.setDescription('No users have earned any currency yet!');
    } else {
      // Fetch user information for each entry
      let leaderboardText = '';
      let position = 1;
      
      for (const entry of leaderboard) {
        try {
          // Try to fetch the user
          const user = await interaction.client.users.fetch(entry.userId);
          const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
          
          leaderboardText += `${medal} **${user.username}**: ${economy.currency.symbol} ${entry.balance.toLocaleString()} ${economy.currency.name}\n`;
        } catch (error) {
          // If user can't be fetched, use their ID
          const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
          leaderboardText += `${medal} **User-${entry.userId}**: ${economy.currency.symbol} ${entry.balance.toLocaleString()} ${economy.currency.name}\n`;
        }
        
        position++;
      }
      
      // Find the user's position on the leaderboard
      const userId = interaction.user.id;
      const userBalance = await economy.getBalance(userId);
      
      // Add user's position to the embed
      embed.setDescription(leaderboardText);
      embed.addFields({
        name: 'Your Balance',
        value: `${economy.currency.symbol} ${userBalance.toLocaleString()} ${economy.currency.name}`
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  },
};