const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the kick')
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
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Check if the target user is kickable
        if (!targetMember.kickable) {
            const notKickableEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Cannot Kick User')
                .setDescription('I do not have permission to kick this user. They may have higher permissions than me.')
                .setTimestamp();
                
            return interaction.reply({ embeds: [notKickableEmbed], ephemeral: true });
        }
        
        // Check if the user is trying to kick themselves
        if (targetUser.id === interaction.user.id) {
            const selfKickEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You cannot kick yourself!')
                .setTimestamp();
                
            return interaction.reply({ embeds: [selfKickEmbed], ephemeral: true });
        }
        
        try {
            // Send DM to the user being kicked if possible
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffa500') // Orange color for kicks
                    .setTitle(`You have been kicked from ${interaction.guild.name}`)
                    .setDescription(`Reason: ${reason}`)
                    .setFooter({ text: 'You can rejoin the server with a new invite link.' })
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // Unable to DM the user, continue with the kick
                console.error(`Could not DM user ${targetUser.tag}: ${error}`);
            }
            
            // Kick the user
            await targetMember.kick(reason);
            
            // Reply with success message
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('User Kicked')
                .setDescription(`Successfully kicked ${targetUser.tag}`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error(`Error kicking user: ${error}`);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription(`Failed to kick user: ${error.message}`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};