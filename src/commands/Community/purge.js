const { SlashCommandBuilder } = require('@discordjs/builders');
const LicenseKeySchema = require("../../Schemas/LicenseKeySchema")
const { generateKey } = require('../../lib/keys');
const { MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
  .setName("purge")
  .setDescription("purge all keys"),  

   async execute(interaction) {
       await interaction.deferReply({flags: MessageFlags.Ephemeral});
       try {
           await LicenseKeySchema.deleteMany({});
           return interaction.editReply("✅ Successfully purged all keys.");
       } catch (e) {
           console.error(e);
           return interaction.editReply("Failed to purge keys.");
       }
   },
};