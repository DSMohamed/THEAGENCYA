const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Duration of the timeout (e.g. 1h, 1d, 7d)')
                .setRequired(true)
                .addChoices(
                    { name: '60 seconds', value: '60s' },
                    { name: '5 minutes', value: '5m' },
                    { name: '10 minutes', value: '10m' },
                    { name: '1 hour', value: '1h' },
                    { name: '1 day', value: '1d' },
                    { name: '1 week', value: '7d' },
                ))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
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
        const durationOption = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Convert duration string to milliseconds
        let durationMs;
        const durationValue = durationOption.slice(0, -1);
        const durationType = durationOption.slice(-1);
        
        switch (durationType) {
            case 's':
                durationMs = parseInt(durationValue) * 1000;
                break;
            case 'm':
                durationMs = parseInt(durationValue) * 60 * 1000;
                break;
            case 'h':
                durationMs = parseInt(durationValue) * 60 * 60 * 1000;
                break;
            case 'd':
                durationMs = parseInt(durationValue) * 24 * 60 * 60 * 1000;
                break;
            default:
                durationMs = 60 * 1000; // Default to 1 minute if invalid
        }
        
        // Format duration for display
        let formattedDuration;
        if (durationType === 's') {
            formattedDuration = `${durationValue} second${parseInt(durationValue) !== 1 ? 's' : ''}`;
        } else if (durationType === 'm') {
            formattedDuration = `${durationValue} minute${parseInt(durationValue) !== 1 ? 's' : ''}`;
        } else if (durationType === 'h') {
            formattedDuration = `${durationValue} hour${parseInt(durationValue) !== 1 ? 's' : ''}`;
        } else if (durationType === 'd') {
            formattedDuration = `${durationValue} day${parseInt(durationValue) !== 1 ? 's' : ''}`;
        }
        
        // Check if the target user is timeoutable
        if (!targetMember.moderatable) {
            const notModerableEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Cannot Timeout User')
                .setDescription('I do not have permission to timeout this user. They may have higher permissions than me.')
                .setTimestamp();
                
            return interaction.reply({ embeds: [notModerableEmbed], ephemeral: true });
        }
        
        // Check if the user is trying to timeout themselves
        if (targetUser.id === interaction.user.id) {
            const selfTimeoutEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You cannot timeout yourself!')
                .setTimestamp();
                
            return interaction.reply({ embeds: [selfTimeoutEmbed], ephemeral: true });
        }
        
        try {
            // Send DM to the user being timed out if possible
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffa500') // Orange color for timeouts
                    .setTitle(`You have been timed out in ${interaction.guild.name}`)
                    .setDescription(`Duration: ${formattedDuration}\nReason: ${reason}`)
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // Unable to DM the user, continue with the timeout
                console.error(`Could not DM user ${targetUser.tag}: ${error}`);
            }
            
            // Timeout the user
            await targetMember.timeout(durationMs, reason);
            
            // Reply with success message
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('User Timed Out')
                .setDescription(`Successfully timed out ${targetUser.tag}`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Duration', value: formattedDuration, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error(`Error timing out user: ${error}`);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription(`Failed to timeout user: ${error.message}`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};