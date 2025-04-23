const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
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
        
        // Check if the target user is bannable
        if (!targetMember.bannable) {
            const notBannableEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Cannot Ban User')
                .setDescription('I do not have permission to ban this user. They may have higher permissions than me.')
                .setTimestamp();
                
            return interaction.reply({ embeds: [notBannableEmbed], ephemeral: true });
        }
        
        // Check if the user is trying to ban themselves
        if (targetUser.id === interaction.user.id) {
            const selfBanEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('You cannot ban yourself!')
                .setTimestamp();
                
            return interaction.reply({ embeds: [selfBanEmbed], ephemeral: true });
        }
        
        try {
            // Send DM to the user being banned if possible
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`You have been banned from ${interaction.guild.name}`)
                    .setDescription(`Reason: ${reason}`)
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // Unable to DM the user, continue with the ban
                console.error(`Could not DM user ${targetUser.tag}: ${error}`);
            }
            
            // Ban the user
            await interaction.guild.members.ban(targetUser, { reason });
            
            // Reply with success message
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('User Banned')
                .setDescription(`Successfully banned ${targetUser.tag}`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error(`Error banning user: ${error}`);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription(`Failed to ban user: ${error.message}`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};