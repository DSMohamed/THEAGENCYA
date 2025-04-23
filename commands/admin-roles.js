const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-roles")
    .setDescription("Manage admin roles for economy commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a role to admin roles")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to add as admin")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set-display")
        .setDescription("Set which role can see admin commands in slash menu")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role that can see admin commands")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get-display")
        .setDescription("See which role can currently see admin commands")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove-display")
        .setDescription(
          "Remove the display role (makes admin commands visible to all)"
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a role from admin roles")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to remove from admin")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all admin roles")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Check if user has permission (server owner always has permission)
    const hasPermission =
      interaction.user.id === interaction.guild.ownerId ||
      (await economy.hasAdminPermission(interaction.member));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Permission Denied")
        .setDescription("You do not have permission to manage admin roles.")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "set-display") {
      const role = interaction.options.getRole("role");

      // Set the display role
      await economy.setDisplayRoleId(role.id);

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Display Role Set")
        .setDescription(
          `The role **${role.name}** can now see admin commands in the slash menu.`
        )
        .setFooter({
          text: "Only users with this role will see admin commands",
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "get-display") {
      const displayRoleId = await economy.getDisplayRoleId();

      if (!displayRoleId) {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("ℹ️ Display Role")
          .setDescription(
            "No display role is set. Admin commands are currently visible to everyone."
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      try {
        const role = await interaction.guild.roles.fetch(displayRoleId);

        if (role) {
          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("ℹ️ Display Role")
            .setDescription(
              `The role **${role.name}** can currently see admin commands.`
            )
            .addFields({ name: "Role ID", value: displayRoleId })
            .setTimestamp();

          return interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = new EmbedBuilder()
            .setColor("#ffaa00")
            .setTitle("⚠️ Display Role Not Found")
            .setDescription(
              `The configured role (ID: ${displayRoleId}) could not be found. It may have been deleted.`
            )
            .setFooter({
              text: "Use /admin-roles set-display to set a new display role",
            })
            .setTimestamp();

          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription(
            `Failed to retrieve role information: ${error.message}`
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } else if (subcommand === "remove-display") {
      await economy.setDisplayRoleId(""); // Use empty string instead of null

      const embed = new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle("ℹ️ Display Role Removed")
        .setDescription(
          "Display role has been removed. Admin commands are now visible to everyone."
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "add") {
      const role = interaction.options.getRole("role");

      // Add role to admin roles
      await economy.addAdminRole(role.id);

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Admin Role Added")
        .setDescription(
          `The role **${role.name}** has been added to admin roles.`
        )
        .setFooter({
          text: "Users with this role can now use admin economy commands",
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "remove") {
      const role = interaction.options.getRole("role");

      // Remove role from admin roles
      await economy.removeAdminRole(role.id);

      const embed = new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle("⚠️ Admin Role Removed")
        .setDescription(
          `The role **${role.name}** has been removed from admin roles.`
        )
        .setFooter({
          text: "Users with only this role can no longer use admin economy commands",
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "list") {
      const adminRoles = await economy.getAdminRoles();

      let roleList = "";

      if (adminRoles.length === 0) {
        roleList =
          "No admin roles configured. Only the server owner can use admin commands.";
      } else {
        for (const roleId of adminRoles) {
          try {
            const role = await interaction.guild.roles.fetch(roleId);
            if (role) {
              roleList += `• **${role.name}** (ID: ${role.id})\n`;
            } else {
              roleList += `• Role not found (ID: ${roleId})\n`;
            }
          } catch (error) {
            roleList += `• Role not found (ID: ${roleId})\n`;
          }
        }
      }

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("🛡️ Admin Roles")
        .setDescription(
          "The following roles have admin permissions for economy commands:"
        )
        .addFields({ name: "Roles", value: roleList })
        .setFooter({ text: "Note: Server owner always has admin permissions" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  },
};
