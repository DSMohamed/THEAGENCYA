const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    // Set bot's activity to show it's an economy bot
    client.user.setActivity('with Economy Commands', { type: 'PLAYING' });
  },
};