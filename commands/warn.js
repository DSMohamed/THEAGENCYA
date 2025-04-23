const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user for breaking rules')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
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
        
        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        
        // Check if the user is trying to warn themselves
        if (targetUser.id === interaction.user.id) {
            const selfWarnEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You cannot warn yourself!')
                .setTimestamp();
                
            return interaction.reply({ embeds: [selfWarnEmbed], ephemeral: true });
        }
        
        // Check if the user is trying to warn the bot
        if (targetUser.id === interaction.client.user.id) {
            const botWarnEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You cannot warn the bot!')
                .setTimestamp();
                
            return interaction.reply({ embeds: [botWarnEmbed], ephemeral: true });
        }
        
        try {
            // Get all existing warnings to show count
            const existingWarnings = await economy.getWarnings(interaction.guild.id, targetUser.id);
            
            // Add the warning to the database
            const warning = await economy.addWarning(
                interaction.guild.id,
                targetUser.id,
                interaction.user.id,
                reason
            );
            
            // Send DM to the warned user if possible
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffa500') // Orange color for warnings
                    .setTitle(`You have been warned in ${interaction.guild.name}`)
                    .setDescription(`This is warning #${existingWarnings.length + 1}`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: `${interaction.user.tag}` }
                    )
                    .setFooter({ text: 'Please review the server rules to avoid further action.' })
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // Unable to DM the user, continue with the warning
                console.error(`Could not DM user ${targetUser.tag}: ${error}`);
            }
            
            // Reply with success message
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('User Warned')
                .setDescription(`Successfully warned ${targetUser.tag}`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Warning ID', value: `#${warning.id}`, inline: true },
                    { name: 'Total Warnings', value: `${existingWarnings.length + 1}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error(`Error warning user: ${error}`);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription(`Failed to warn user: ${error.message}`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};