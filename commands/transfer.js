const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Send currency to another user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to send currency to')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount of currency to send')
        .setRequired(true)
        .setMinValue(1)),
        
  async execute(interaction) {
    await interaction.deferReply();
    
    const sender = interaction.user;
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    
    // Check if trying to send to self
    if (sender.id === recipient.id) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Transfer Failed')
        .setDescription('You cannot send currency to yourself!');
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Check if recipient is a bot
    if (recipient.bot) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Transfer Failed')
        .setDescription('You cannot send currency to a bot!');
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Get sender's balance
    const senderBalance = await economy.getBalance(sender.id);
    
    // Check if sender has enough currency
    if (senderBalance < amount) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Insufficient Funds')
        .setDescription(`You don't have enough ${economy.currency.name} to send!\n` +
          `Your balance: ${economy.currency.symbol} ${senderBalance.toLocaleString()}\n` +
          `Amount to send: ${economy.currency.symbol} ${amount.toLocaleString()}`)
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Transfer the currency
    const success = await economy.transferBalance(sender.id, recipient.id, amount);
    
    if (!success) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Transfer Failed')
        .setDescription('An error occurred while transferring the currency. Please try again later.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Get updated balances
    const newSenderBalance = await economy.getBalance(sender.id);
    const newRecipientBalance = await economy.getBalance(recipient.id);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Transfer Successful')
      .setDescription(`You sent ${economy.currency.symbol} ${amount.toLocaleString()} ${economy.currency.name} to ${recipient.username}!`)
      .addFields(
        { name: 'Your New Balance', value: `${economy.currency.symbol} ${newSenderBalance.toLocaleString()} ${economy.currency.name}` },
        { name: `${recipient.username}'s New Balance`, value: `${economy.currency.symbol} ${newRecipientBalance.toLocaleString()} ${economy.currency.name}` }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  },
};