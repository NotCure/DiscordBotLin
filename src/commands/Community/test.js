
import { SlashCommandBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test the bot connection.');
export async function execute(interaction) {
    await interaction.reply('Pong!');
}