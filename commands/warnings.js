const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View or manage warnings for a user')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View all warnings for a user')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to check warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addIntegerOption(option => 
                    option.setName('warning_id')
                        .setDescription('The ID of the warning to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true)))
        .setDMPermission(false),
        
    async execute(interaction) {
        // Check if user has admin permissions
        const hasPermission = await economy.hasAdminPermission(interaction.member);
        
        if (!hasPermission) {
            const noPermEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setTimestamp();
                
            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        
        if (subcommand === 'view') {
            // Get all warnings for the user
            const warnings = await economy.getWarnings(interaction.guild.id, targetUser.id);
            
            if (!warnings || warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('No Warnings')
                    .setDescription(`${targetUser.tag} has no warnings.`)
                    .setTimestamp();
                    
                return interaction.reply({ embeds: [noWarningsEmbed] });
            }
            
            // Create an embed with all warnings
            const warningsEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle(`Warnings for ${targetUser.tag}`)
                .setDescription(`This user has ${warnings.length} warning(s).`)
                .setTimestamp();
                
            // Add each warning as a field
            warnings.forEach(warning => {
                const date = new Date(warning.timestamp);
                const moderator = interaction.guild.members.cache.get(warning.moderatorId);
                const moderatorName = moderator ? moderator.user.tag : 'Unknown Moderator';
                
                warningsEmbed.addFields({
                    name: `Warning #${warning.id} | ${date.toLocaleDateString()}`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderatorName}\n**Date:** <t:${Math.floor(warning.timestamp / 1000)}:F>`
                });
            });
            
            await interaction.reply({ embeds: [warningsEmbed] });
            
        } else if (subcommand === 'remove') {
            const warningId = interaction.options.getInteger('warning_id');
            
            // Remove the warning
            const removed = await economy.removeWarning(interaction.guild.id, targetUser.id, warningId);
            
            if (removed) {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Warning Removed')
                    .setDescription(`Successfully removed warning #${warningId} from ${targetUser.tag}.`)
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error')
                    .setDescription(`Warning #${warningId} not found for ${targetUser.tag}.`)
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'clear') {
            // Confirm the action with a button
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('Confirm Action')
                .setDescription(`Are you sure you want to clear all warnings for ${targetUser.tag}?`)
                .setTimestamp();
                
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_clear')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Danger);
                
            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_clear')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);
                
            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            
            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [row],
                fetchReply: true
            });
            
            // Create a collector for button interactions
            const filter = i => i.user.id === interaction.user.id;
            const collector = response.createMessageComponentCollector({ filter, time: 15000 });
            
            collector.on('collect', async i => {
                if (i.customId === 'confirm_clear') {
                    // Clear all warnings
                    const count = await economy.clearWarnings(interaction.guild.id, targetUser.id);
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Warnings Cleared')
                        .setDescription(`Successfully cleared ${count} warning(s) from ${targetUser.tag}.`)
                        .setTimestamp();
                        
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel_clear') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('Action Cancelled')
                        .setDescription(`No warnings were cleared.`)
                        .setTimestamp();
                        
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
            
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('Timed Out')
                        .setDescription('No response received, action cancelled.')
                        .setTimestamp();
                        
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });
        }
    },
};