const { SlashCommandBuilder } = require('@discordjs/builders');
const License = require("../../Schemas/LicenseKeySchema")
const { generateKey } = require('../../lib/keys');
const { MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove (revoke) a license key")
  .addStringOption(o =>
    o.setName("key").setDescription("The license key").setRequired(true)
  )
  .addBooleanOption(o =>
    o.setName("hard").setDescription("Hard delete from DB (default: false)")
  ),
    async execute(interaction) {
      await interaction.deferReply({flags: MessageFlags.Ephemeral});

      const key = interaction.options.getString("key");
      const hard = interaction.options.getBoolean("hard") ?? false;


        try {
    if (hard) {
      const res = await License.deleteOne({ key });
      if (res.deletedCount === 0) return interaction.editReply("⚠️ Key not found.");
      return interaction.editReply(`🗑️ Hard-deleted \`${key}\`.`);
    } else {
      const doc = await License.findOneAndUpdate(
        { key },
        { $set: { revoked: true } },
        { new: true }
      );
      if (!doc) return interaction.editReply("⚠️ Key not found.");
      return interaction.editReply(`🚫 Revoked \`${key}\`.`);
    }
  } catch (e) {
    console.error(e);
    return interaction.editReply("❌ Failed to remove key.");
  }

    },
};