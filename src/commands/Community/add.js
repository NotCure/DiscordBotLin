// commands/admin/add.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const LicenseKey = require("../../Schemas/LicenseKeySchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a MachoAuthenticationKey + Player Name")
    .addStringOption(o =>
      o.setName("key")
       .setDescription("MachoAuthenticationKey")
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("player")
       .setDescription("Player name (as shown in-game)")
       .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const machoKey  = (interaction.options.getString("key") || "").trim();
      const playerName = (interaction.options.getString("player") || "").trim();

      if (!machoKey || !playerName) {
        return interaction.editReply("❌ Missing key or player name.");
      }

      // Fail if the key already exists (keeps things clean/predictable)
      const exists = await LicenseKey.findOne({ key: machoKey }).lean();
      if (exists) {
        return interaction.editReply("❌ That MachoAuthenticationKey already exists.");
      }

      const doc = await LicenseKey.create({
        key: machoKey,
        playerName,
        playerNameLower: playerName.toLowerCase(),

      });

      return interaction.editReply(
        `✅ Added key \`${doc.key}\` for player **${doc.playerName}**.`
      );
    } catch (e) {
      console.error(e);
      return interaction.editReply("❌ Failed to add. Check logs for details.");
    }
  },
};
