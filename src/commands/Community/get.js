const { SlashCommandBuilder } = require('@discordjs/builders');
const LicenseKeySchema = require("../../Schemas/LicenseKeySchema")
const { generateKey } = require('../../lib/keys');
const { MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
  .setName("get")
  .setDescription("Generate random license key(s)")
  .addIntegerOption(o =>
    o.setName("count").setDescription("How many keys (1-20)").setMinValue(1).setMaxValue(20)
  )
  .addStringOption(o =>
    o.setName("prefix").setDescription("Prefix for keys, default LC")
  ),
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const count = interaction.options.getInteger("count") || 1;
        const prefix = interaction.options.getString("prefix") || "LC";

    const toInsert = [];
    for (let i = 0; i < count; i++) {
        toInsert.push({
        key: generateKey({ prefix }),
        createdBy: interaction.user.id,
        });
    }


        try {
        const docs = await LicenseKeySchema.insertMany(toInsert, { ordered: false });
        const list = docs.map(d => `\`${d.key}\``).join("\n");
        return interaction.editReply(`✅ Generated ${docs.length} key(s):\n${list}`);
    } catch (e) {
        console.error(e);
        return interaction.editReply("Failed to generate keys.");
    }
        
    },
};