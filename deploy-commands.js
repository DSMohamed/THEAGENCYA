require("dotenv").config();
const { REST, Routes, PermissionsBitField } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const economy = require("./utils/economy"); // Import the economy utility for role control

const commands = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, "commands");
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath, { recursive: true });
  console.log(`Created commands directory at ${commandsPath}`);
}

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy commands!
(async () => {
  try {
    // Check if a display role is set for admin commands
    const displayRoleId = await economy.getDisplayRoleId();

    // Always restrict admin commands visibility
    console.log("Applying visibility restrictions to admin commands...");

    // For each command, check if it's an admin command and apply permissions
    for (const command of commands) {
      // Identify admin commands (prefixed with admin- or specific admin commands)
      const adminCommands = [
        "admin-roles",
        "admin-economy",
        "admin-shop",
        "embed",
        "rules",
        "info",
        "clear",
      ];

      // Hide all admin commands from regular users by requiring Administrator permission
      if (adminCommands.includes(command.name)) {
        // Using ManageGuild (Manage Server) permission instead of Administrator
        // This is a less privileged permission that can be safely given to trusted roles
        command.default_member_permissions =
          PermissionsBitField.Flags.ManageGuild.toString();

        console.log(
          `Restricting visibility of ${command.name} to users with Manage Server permission`
        );
      }
    }

    console.log(
      "IMPORTANT: Only users with 'Manage Server' permission will see admin commands"
    );
    console.log(
      "To make admin commands visible to a role, give that role 'Manage Server' permission in Discord"
    );

    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in all guilds with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );

    console.log(
      "Remember: You can control admin command visibility by giving the 'Manage Server' permission to roles in your server settings"
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
