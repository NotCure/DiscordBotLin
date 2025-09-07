// commands/admin/remove.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const License = require("../../Schemas/LicenseKeySchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Hard delete license(s) by key or player name")
    .addStringOption(o =>
      o.setName("key")
       .setDescription("Exact license key to delete")
       .setRequired(false)
    )
    .addStringOption(o =>
      o.setName("name")
       .setDescription("Player name to delete all bound keys for")
       .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const key  = interaction.options.getString("key");
      const name = interaction.options.getString("name");

      if (!key && !name) {
        return interaction.editReply("❌ Provide either a **key** or a **name**.");
      }

      // If both provided, prefer key
      if (key) {
        const res = await License.deleteOne({ key });
        if (res.deletedCount === 0) {
          return interaction.editReply(`⚠️ Key not found: \`${key}\`.`);
        }
        return interaction.editReply(`🗑️ Hard-deleted key \`${key}\`.`);
      }

      const nameLower = name.toLowerCase();
      const res = await License.deleteMany({ playerNameLower: nameLower });
      if (res.deletedCount === 0) {
        return interaction.editReply(`⚠️ No keys found for player **${name}**.`);
      }
      return interaction.editReply(`🗑️ Hard-deleted **${res.deletedCount}** key(s) for **${name}**.`);
    } catch (e) {
      console.error(e);
      return interaction.editReply("❌ Failed to remove key(s).");
    }
  },
};
