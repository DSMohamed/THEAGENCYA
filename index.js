require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const express = require("express");
const app = express();

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Initialize commands collection
client.commands = new Collection();

// Load commands from commands directory
const commandsPath = path.join(__dirname, "commands");
try {
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log(`Created commands directory at ${commandsPath}`);
  }

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Set a new item in the Collection with the key as the command name and the value as the command module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
} catch (error) {
  console.error("Error loading commands:", error);
}

// Load events from events directory
const eventsPath = path.join(__dirname, "events");
try {
  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
    console.log(`Created events directory at ${eventsPath}`);
  }

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
} catch (error) {
  console.error("Error loading events:", error);
}

// Log in to Discord with token
client.login(process.env.DISCORD_TOKEN);
